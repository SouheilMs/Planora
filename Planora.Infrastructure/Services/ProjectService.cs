using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Projects;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Data;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _dbContext;

    public ProjectService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<ApplicationUser> userManager, ApplicationDbContext dbContext)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _userManager = userManager;
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<ProjectDto>> GetProjectsAsync(string userId, int page, int pageSize, string? search = null)
    {
        var pmWorkspaceIds = await _dbContext.Workspaces
            .Where(w => w.ProjectManagerId == userId)
            .Select(w => w.Id)
            .ToListAsync();

        var visibleProjects = ProjectQuery()
            .Where(p =>
                p.Workspace.OwnerId == userId ||
                p.ProjectManagerId == userId ||
                p.Users.Any(u => u.UserId == userId) ||
                pmWorkspaceIds.Contains(p.WorkspaceId)
            );

        if (!string.IsNullOrWhiteSpace(search))
            visibleProjects = visibleProjects.Where(p => p.Name.Contains(search));

        var total = await visibleProjects.CountAsync();
        var projects = await visibleProjects
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = projects.Select(p => MapProjectDto(p));

        return new PaginatedResultDto<ProjectDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId)
    {
        var pmWorkspaceIds = await _dbContext.Workspaces
            .Where(w => w.ProjectManagerId == userId)
            .Select(w => w.Id)
            .ToListAsync();

        var project = await ProjectQuery()
            .FirstOrDefaultAsync(p => p.Id == id && (
                p.Workspace.OwnerId == userId ||
                p.ProjectManagerId == userId ||
                p.Users.Any(u => u.UserId == userId) ||
                pmWorkspaceIds.Contains(p.WorkspaceId)
            ));

        if (project == null) return null;
        return MapProjectDto(project);
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, string currentUserId)
    {
        var workspace = await _dbContext.Workspaces
            .Include(w => w.Members)
            .FirstOrDefaultAsync(w => w.Id == dto.WorkspaceId)
            ?? throw new KeyNotFoundException($"Workspace with ID {dto.WorkspaceId} not found.");

        var currentUser = await _userManager.FindByIdAsync(currentUserId);
        var userRoles = await _userManager.GetRolesAsync(currentUser);

        var isOwner = workspace.OwnerId == currentUserId;
        var isAdmin = userRoles.Contains("Admin");
        var isProjectManager = userRoles.Contains("ProjectManager");

        var isPMemberOfWorkspace = false;
        if (isProjectManager)
        {
            isPMemberOfWorkspace = await _dbContext.WorkspaceUsers
                .AnyAsync(wu => wu.WorkspaceId == workspace.Id && wu.UserId == currentUserId);
        }

        var hasAccess = isOwner || isAdmin || (isProjectManager && isPMemberOfWorkspace);
        if (!hasAccess)
            throw new UnauthorizedAccessException("You don't have permission to create projects in this workspace.");

        var projectManager = await _userManager.FindByIdAsync(dto.ProjectManagerId)
            ?? throw new KeyNotFoundException($"User with ID {dto.ProjectManagerId} not found.");

        var isPmWorkspaceMember = await _dbContext.WorkspaceUsers
            .AnyAsync(wu => wu.WorkspaceId == workspace.Id && wu.UserId == projectManager.Id);

        if (!isPmWorkspaceMember && workspace.OwnerId != projectManager.Id)
            throw new InvalidOperationException("The designated project manager must be a workspace member.");

        var project = _mapper.Map<Project>(dto);
        project.Id = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;
        project.WorkspaceId = workspace.Id;
        project.ProjectManagerId = projectManager.Id;
        project.ProjectManager = projectManager;
        project.Users.Add(new ProjectUser
        {
            ProjectId = project.Id,
            UserId = projectManager.Id,
            AssignedAt = DateTime.UtcNow
        });

        await _unitOfWork.Projects.AddAsync(project);
        await _unitOfWork.SaveChangesAsync();

        return MapProjectDto(project);
    }

    public async Task<ProjectDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .Include(p => p.ProjectManager)
            .Include(p => p.Users)
            .Include(p => p.BacklogItems)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Project not found.");

        var isOwner = project.Workspace.OwnerId == userId;
        var isManager = project.ProjectManagerId == userId;
        if (!isOwner && !isManager)
            throw new UnauthorizedAccessException("Only workspace owner or project manager can modify project details.");

        if (isOwner && !isManager)
        {
            var triesToChangeDetails =
                !string.Equals(dto.Name, project.Name, StringComparison.Ordinal) ||
                !string.Equals(dto.Description, project.Description, StringComparison.Ordinal) ||
                dto.StartDate != project.StartDate ||
                dto.EndDate != project.EndDate;

            if (triesToChangeDetails)
                throw new UnauthorizedAccessException("Workspace owner can only reassign project manager. Project details can be modified by the project manager.");
        }

        var projectManagerId = project.ProjectManagerId;
        if (!string.IsNullOrWhiteSpace(dto.ProjectManagerId) && dto.ProjectManagerId != project.ProjectManagerId)
        {
            if (!isOwner)
                throw new UnauthorizedAccessException("Only workspace owner can reassign project manager.");

            var newManagerExists = await _dbContext.WorkspaceUsers
                .AnyAsync(wu => wu.WorkspaceId == project.WorkspaceId && wu.UserId == dto.ProjectManagerId);

            if (!newManagerExists && project.Workspace.OwnerId != dto.ProjectManagerId)
                throw new InvalidOperationException("New project manager must be a workspace member.");

            projectManagerId = dto.ProjectManagerId;

            var newManagerMemberExists = await _unitOfWork.ProjectUsers
                .ExistsAsync(pm => pm.ProjectId == project.Id && pm.UserId == projectManagerId);
            if (!newManagerMemberExists)
            {
                project.Users.Add(new ProjectUser
                {
                    ProjectId = project.Id,
                    UserId = projectManagerId,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        _mapper.Map(dto, project);
        project.ProjectManagerId = projectManagerId;
        project.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Projects.Update(project);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ProjectDto>(project);
    }

    public async Task DeleteProjectAsync(Guid id)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id) ?? throw new KeyNotFoundException("Project not found.");

        project.IsDeleted = true;
        project.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Projects.Update(project);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task AddMemberAsync(Guid projectId, string userIdToAssign, string currentUserId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var canManage = project.ProjectManagerId == currentUserId || project.Workspace.OwnerId == currentUserId;
        if (!canManage)
            throw new UnauthorizedAccessException("Only the workspace owner or project manager can add members.");

        var targetUser = await _userManager.FindByIdAsync(userIdToAssign)
            ?? throw new KeyNotFoundException("User not found.");

        var isWorkspaceMember = await _dbContext.WorkspaceUsers
            .AnyAsync(wu => wu.WorkspaceId == project.WorkspaceId && wu.UserId == targetUser.Id);
        if (!isWorkspaceMember && project.Workspace.OwnerId != targetUser.Id)
            throw new InvalidOperationException("User must already be a workspace member.");

        var exists = await _unitOfWork.ProjectUsers.ExistsAsync(pm => pm.ProjectId == project.Id && pm.UserId == targetUser.Id);
        if (exists) throw new InvalidOperationException("User is already a member of this project.");

        var member = new ProjectUser
        {
            ProjectId = project.Id,
            UserId = targetUser.Id,
            AssignedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProjectUsers.AddAsync(member);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid projectId, string userIdToRemove, string currentUserId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var canManage = project.ProjectManagerId == currentUserId || project.Workspace.OwnerId == currentUserId;
        if (!canManage)
            throw new UnauthorizedAccessException("Only the workspace owner or project manager can remove members.");

        if (project.ProjectManagerId == userIdToRemove)
            throw new InvalidOperationException("Project manager cannot be removed from the project.");

        var members = await _unitOfWork.ProjectUsers.FindAsync(pm => pm.ProjectId == project.Id && pm.UserId == userIdToRemove);
        var member = members.FirstOrDefault() ?? throw new KeyNotFoundException("Member not found in project.");

        _unitOfWork.ProjectUsers.Delete(member);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<ProjectInviteableUserDto>> GetInviteableUsersAsync(Guid projectId, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var canManage = project.ProjectManagerId == userId || project.Workspace.OwnerId == userId;
        if (!canManage)
            throw new UnauthorizedAccessException("Only the workspace owner or project manager can invite members.");

        var workspaceMemberIds = await _dbContext.WorkspaceUsers
            .Where(wu => wu.WorkspaceId == project.WorkspaceId)
            .Select(wu => wu.UserId)
            .ToListAsync();

        workspaceMemberIds.Add(project.Workspace.OwnerId);

        var projectMemberIds = await _dbContext.ProjectUsers
            .Where(pu => pu.ProjectId == projectId)
            .Select(pu => pu.UserId)
            .ToListAsync();

        var pendingInvitationUserIds = await _dbContext.ProjectInvitations
            .Where(i => i.ProjectId == projectId && !i.Accepted && i.ExpiresAt > DateTime.UtcNow)
            .Select(i => i.UserId)
            .ToListAsync();

        var inviteableUsers = await _userManager.Users
            .Where(u => u.IsActive && workspaceMemberIds.Contains(u.Id))
            .Where(u => !projectMemberIds.Contains(u.Id))
            .Where(u => !pendingInvitationUserIds.Contains(u.Id))
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();

        return inviteableUsers.Select(u => new ProjectInviteableUserDto
        {
            UserId = u.Id,
            FullName = $"{u.FirstName} {u.LastName}",
            Email = u.Email ?? string.Empty
        }).ToList();
    }

    public async Task<ProjectInvitationDto> InviteMemberAsync(Guid projectId, InviteProjectMemberDto dto, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var canManage = project.ProjectManagerId == userId || project.Workspace.OwnerId == userId;
        if (!canManage)
            throw new UnauthorizedAccessException("Only the workspace owner or project manager can invite members.");

        var targetUser = await _userManager.FindByIdAsync(dto.UserId)
            ?? throw new KeyNotFoundException("User not found.");

        var isWorkspaceMember = await _dbContext.WorkspaceUsers
            .AnyAsync(wu => wu.WorkspaceId == project.WorkspaceId && wu.UserId == dto.UserId);
        if (!isWorkspaceMember && project.Workspace.OwnerId != dto.UserId)
            throw new InvalidOperationException("User must be a workspace member to be invited to a project.");

        var isProjectMember = await _dbContext.ProjectUsers
            .AnyAsync(pu => pu.ProjectId == projectId && pu.UserId == dto.UserId);
        if (isProjectMember)
            throw new InvalidOperationException("User is already a project member.");

        var hasPendingInvitation = await _dbContext.ProjectInvitations
            .AnyAsync(i => i.ProjectId == projectId && i.UserId == dto.UserId && !i.Accepted && i.ExpiresAt > DateTime.UtcNow);
        if (hasPendingInvitation)
            throw new InvalidOperationException("A pending invitation already exists for this user.");

        var invitation = new ProjectInvitation
        {
            ProjectId = projectId,
            UserId = dto.UserId,
            InvitedByUserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Accepted = false,
            CreatedAt = DateTime.UtcNow
        };

        await _dbContext.ProjectInvitations.AddAsync(invitation);
        await _dbContext.SaveChangesAsync();

        var invitedByUser = await _userManager.FindByIdAsync(userId);
        return new ProjectInvitationDto
        {
            Id = invitation.Id,
            ProjectId = projectId,
            ProjectName = project.Name,
            UserId = targetUser.Id,
            UserFullName = $"{targetUser.FirstName} {targetUser.LastName}",
            UserEmail = targetUser.Email ?? string.Empty,
            InvitedByUserId = userId,
            InvitedByFullName = $"{invitedByUser?.FirstName} {invitedByUser?.LastName}",
            ExpiresAt = invitation.ExpiresAt,
            Accepted = false,
            CreatedAt = invitation.CreatedAt
        };
    }

    public async Task<IEnumerable<ProjectInvitationDto>> GetPendingInvitationsAsync(string userId)
    {
        var invitations = await _dbContext.ProjectInvitations
            .Include(i => i.Project)
            .Include(i => i.InvitedByUser)
            .Where(i => i.UserId == userId && !i.Accepted && i.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return invitations.Select(i => new ProjectInvitationDto
        {
            Id = i.Id,
            ProjectId = i.ProjectId,
            ProjectName = i.Project.Name,
            UserId = userId,
            UserFullName = string.Empty,
            UserEmail = string.Empty,
            InvitedByUserId = i.InvitedByUserId,
            InvitedByFullName = $"{i.InvitedByUser.FirstName} {i.InvitedByUser.LastName}",
            ExpiresAt = i.ExpiresAt,
            Accepted = false,
            CreatedAt = i.CreatedAt
        }).ToList();
    }

    public async Task AcceptProjectInvitationAsync(Guid invitationId, string userId)
    {
        var invitation = await _dbContext.ProjectInvitations
            .FirstOrDefaultAsync(i => i.Id == invitationId)
            ?? throw new KeyNotFoundException("Invitation not found.");

        if (invitation.UserId != userId)
            throw new UnauthorizedAccessException("This invitation does not belong to the current user.");

        if (invitation.Accepted)
            throw new InvalidOperationException("Invitation has already been accepted.");

        if (invitation.ExpiresAt <= DateTime.UtcNow)
            throw new InvalidOperationException("Invitation has expired.");

        var isProjectMember = await _dbContext.ProjectUsers
            .AnyAsync(pu => pu.ProjectId == invitation.ProjectId && pu.UserId == userId);

        if (!isProjectMember)
        {
            await _dbContext.ProjectUsers.AddAsync(new ProjectUser
            {
                ProjectId = invitation.ProjectId,
                UserId = userId,
                AssignedAt = DateTime.UtcNow
            });
        }

        invitation.Accepted = true;
        invitation.RespondedAt = DateTime.UtcNow;
        _dbContext.ProjectInvitations.Update(invitation);
        await _dbContext.SaveChangesAsync();
    }

    public async Task RejectProjectInvitationAsync(Guid invitationId, string userId)
    {
        var invitation = await _dbContext.ProjectInvitations
            .FirstOrDefaultAsync(i => i.Id == invitationId)
            ?? throw new KeyNotFoundException("Invitation not found.");

        if (invitation.UserId != userId)
            throw new UnauthorizedAccessException("This invitation does not belong to the current user.");

        if (invitation.Accepted)
            throw new InvalidOperationException("Invitation has already been accepted.");

        if (invitation.ExpiresAt <= DateTime.UtcNow)
            throw new InvalidOperationException("Invitation has expired.");

        invitation.Accepted = false;
        invitation.RespondedAt = DateTime.UtcNow;
        invitation.IsDeleted = true;
        _dbContext.ProjectInvitations.Update(invitation);
        await _dbContext.SaveChangesAsync();
    }

    private IQueryable<Project> ProjectQuery()
        => _dbContext.Projects
            .Where(p => !p.IsDeleted)
            .Include(p => p.Workspace)
            .Include(p => p.ProjectManager)
            .Include(p => p.Users).ThenInclude(pu => pu.User)
            .Include(p => p.BacklogItems);

    private ProjectDto MapProjectDto(Project project)
    {
        var dto = _mapper.Map<ProjectDto>(project);
        var backlogItems = project.BacklogItems.Where(b => !b.IsDeleted).ToList();
        dto.ProgressPercentage = backlogItems.Count > 0
            ? Math.Round((double)backlogItems.Count(t => t.Status == (int)Domain.Enums.TaskStatus.Done) / backlogItems.Count * 100, 2)
            : 0;

        if (project.ProjectManager != null && dto.Members.All(member => member.UserId != project.ProjectManagerId))
        {
            dto.Members = dto.Members
                .Concat(new[]
                {
                    new ProjectMemberDto
                    {
                        UserId = project.ProjectManagerId,
                        FullName = $"{project.ProjectManager.FirstName} {project.ProjectManager.LastName}",
                        Email = project.ProjectManager.Email ?? string.Empty
                    }
                })
                .ToList();
        }

        dto.MemberCount = dto.Members.Count;
        return dto;
    }
}