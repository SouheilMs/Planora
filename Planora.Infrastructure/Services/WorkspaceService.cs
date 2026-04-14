using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.Workspaces;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Infrastructure.Data;

namespace Planora.Infrastructure.Services;

public class WorkspaceService : IWorkspaceService
{
  private readonly ApplicationDbContext _dbContext;
  private readonly UserManager<ApplicationUser> _userManager;
  private readonly IMapper _mapper;

  public WorkspaceService(ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager, IMapper mapper)
  {
    _dbContext = dbContext;
    _userManager = userManager;
    _mapper = mapper;
  }

  public async Task<IEnumerable<WorkspaceDto>> GetAccessibleWorkspacesAsync(string userId)
  {
    var workspaces = await WorkspaceQuery()
        .Where(w => w.OwnerId == userId || w.ProjectManagerId == userId || w.Members.Any(m => m.UserId == userId))
        .OrderByDescending(w => w.CreatedAt)
        .ToListAsync();

    return workspaces.Select(_mapper.Map<WorkspaceDto>).ToList();
  }

  public async Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid workspaceId, string userId)
  {
    var workspace = await WorkspaceQuery()
        .FirstOrDefaultAsync(w => w.Id == workspaceId && (w.OwnerId == userId || w.ProjectManagerId == userId || w.Members.Any(m => m.UserId == userId)));

    return workspace == null ? null : _mapper.Map<WorkspaceDto>(workspace);
  }

  public async Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto dto, string ownerUserId)
  {
    var owner = await _userManager.FindByIdAsync(ownerUserId) ?? throw new KeyNotFoundException("Owner user not found.");

    var workspace = new Workspace
    {
      Id = Guid.NewGuid(),
      Name = dto.Name,
      Description = dto.Description,
      OwnerId = owner.Id,
      ProjectManagerId = owner.Id,
      CreatedAt = DateTime.UtcNow
    };

    var ownerMembership = new WorkspaceUser
    {
      WorkspaceId = workspace.Id,
      UserId = owner.Id,
      JoinedAt = DateTime.UtcNow
    };

    await _dbContext.Workspaces.AddAsync(workspace);
    await _dbContext.WorkspaceUsers.AddAsync(ownerMembership);
    await _dbContext.SaveChangesAsync();

    workspace.Owner = owner;
    workspace.ProjectManager = owner;
    workspace.Members = new List<WorkspaceUser> { ownerMembership };
    return _mapper.Map<WorkspaceDto>(workspace);
  }

  public async Task<WorkspaceDto> SetProjectManagerAsync(Guid workspaceId, SetWorkspaceProjectManagerDto dto, string ownerUserId)
  {
    var workspace = await _dbContext.Workspaces
        .Include(w => w.Owner)
        .Include(w => w.ProjectManager)
        .Include(w => w.Members)
        .Include(w => w.Projects)
        .FirstOrDefaultAsync(w => w.Id == workspaceId && w.OwnerId == ownerUserId)
        ?? throw new KeyNotFoundException("Workspace not found.");

    var targetUser = await _userManager.FindByIdAsync(dto.UserId)
        ?? throw new KeyNotFoundException("User not found.");

    var isMember = await _dbContext.WorkspaceUsers
        .AnyAsync(wu => wu.WorkspaceId == workspaceId && wu.UserId == targetUser.Id);
    if (!isMember && workspace.OwnerId != targetUser.Id)
      throw new InvalidOperationException("Project manager must be a workspace member.");

    workspace.ProjectManagerId = targetUser.Id;
    workspace.ProjectManager = targetUser;
    await _dbContext.SaveChangesAsync();

    return _mapper.Map<WorkspaceDto>(workspace);
  }

  public async Task<IEnumerable<WorkspaceInviteableUserDto>> GetInviteableUsersAsync(Guid workspaceId, string userId)
  {
    var canAccess = await _dbContext.Workspaces
        .AnyAsync(w => w.Id == workspaceId && w.OwnerId == userId);
    if (!canAccess)
      throw new KeyNotFoundException("Workspace not found.");

    var memberIds = await _dbContext.WorkspaceUsers
        .Where(wu => wu.WorkspaceId == workspaceId)
        .Select(wu => wu.UserId)
        .ToListAsync();

    var pendingInvitationEmails = await _dbContext.WorkspaceInvitations
        .Where(i => i.WorkspaceId == workspaceId && !i.Accepted && i.ExpiresAt > DateTime.UtcNow)
        .Select(i => i.Email)
        .ToListAsync();

    var inviteableUsers = await _userManager.Users
        .Where(u => u.IsActive && u.Id != userId && u.Email != null)
        .Where(u => !memberIds.Contains(u.Id))
        .Where(u => !pendingInvitationEmails.Contains(u.Email!))
        .OrderBy(u => u.FirstName)
        .ThenBy(u => u.LastName)
        .ToListAsync();

    return inviteableUsers.Select(_mapper.Map<WorkspaceInviteableUserDto>).ToList();
  }

  public async Task<WorkspaceInvitationDto> InviteUserAsync(Guid workspaceId, InviteWorkspaceUserDto dto, string ownerUserId)
  {
    var workspace = await _dbContext.Workspaces
        .FirstOrDefaultAsync(w => w.Id == workspaceId && w.OwnerId == ownerUserId)
        ?? throw new KeyNotFoundException("Workspace not found.");

    var targetUser = await _userManager.FindByIdAsync(dto.UserId)
        ?? throw new KeyNotFoundException("User not found.");

    if (string.IsNullOrWhiteSpace(targetUser.Email))
      throw new InvalidOperationException("The selected user does not have an email address.");

    var email = targetUser.Email.Trim().ToLowerInvariant();

    var alreadyMember = await _dbContext.WorkspaceUsers
        .AnyAsync(wu => wu.WorkspaceId == workspaceId && wu.User.Email != null && wu.User.Email.ToLower() == email);
    if (alreadyMember)
      throw new InvalidOperationException("User is already a workspace member.");

    var hasPendingInvitation = await _dbContext.WorkspaceInvitations
        .AnyAsync(i => i.WorkspaceId == workspaceId && i.Email.ToLower() == email && !i.Accepted && i.ExpiresAt > DateTime.UtcNow);
    if (hasPendingInvitation)
      throw new InvalidOperationException("A pending invitation already exists for this email.");

    var invitation = new WorkspaceInvitation
    {
      WorkspaceId = workspaceId,
      Email = email,
      InvitedByUserId = ownerUserId,
      Token = Guid.NewGuid().ToString("N"),
      ExpiresAt = DateTime.UtcNow.AddDays(7),
      Accepted = false,
      CreatedAt = DateTime.UtcNow
    };

    await _dbContext.WorkspaceInvitations.AddAsync(invitation);
    await _dbContext.SaveChangesAsync();

    invitation.Workspace = workspace;
    return _mapper.Map<WorkspaceInvitationDto>(invitation);
  }

  public async Task<IEnumerable<WorkspaceInvitationDto>> GetPendingInvitationsAsync(string userId)
  {
    var user = await _userManager.FindByIdAsync(userId) ?? throw new KeyNotFoundException("User not found.");
    if (string.IsNullOrWhiteSpace(user.Email))
      return new List<WorkspaceInvitationDto>();

    var email = user.Email.ToLowerInvariant();
    var invitations = await _dbContext.WorkspaceInvitations
        .Include(i => i.Workspace)
        .Where(i => !i.Accepted && i.ExpiresAt > DateTime.UtcNow && i.Email.ToLower() == email)
        .OrderByDescending(i => i.CreatedAt)
        .ToListAsync();

    return invitations.Select(_mapper.Map<WorkspaceInvitationDto>).ToList();
  }

  public async Task AcceptInvitationAsync(Guid invitationId, string userId)
  {
    var user = await _userManager.FindByIdAsync(userId) ?? throw new KeyNotFoundException("User not found.");
    if (string.IsNullOrWhiteSpace(user.Email))
      throw new InvalidOperationException("User email is required to accept invitations.");

    var invitation = await _dbContext.WorkspaceInvitations
        .FirstOrDefaultAsync(i => i.Id == invitationId)
        ?? throw new KeyNotFoundException("Invitation not found.");

    if (invitation.Accepted)
      throw new InvalidOperationException("Invitation has already been accepted.");

    if (invitation.ExpiresAt <= DateTime.UtcNow)
      throw new InvalidOperationException("Invitation has expired.");

    if (!string.Equals(invitation.Email, user.Email, StringComparison.OrdinalIgnoreCase))
      throw new UnauthorizedAccessException("This invitation does not belong to the current user.");

    var alreadyMember = await _dbContext.WorkspaceUsers
        .AnyAsync(wu => wu.WorkspaceId == invitation.WorkspaceId && wu.UserId == userId);

    if (!alreadyMember)
    {
      await _dbContext.WorkspaceUsers.AddAsync(new WorkspaceUser
      {
        WorkspaceId = invitation.WorkspaceId,
        UserId = userId,
        JoinedAt = DateTime.UtcNow
      });
    }

    invitation.Accepted = true;
    invitation.RespondedAt = DateTime.UtcNow;
    await _dbContext.SaveChangesAsync();
  }

  public async Task RejectInvitationAsync(Guid invitationId, string userId)
  {
    var user = await _userManager.FindByIdAsync(userId) ?? throw new KeyNotFoundException("User not found.");
    if (string.IsNullOrWhiteSpace(user.Email))
      throw new InvalidOperationException("User email is required to reject invitations.");

    var invitation = await _dbContext.WorkspaceInvitations
        .FirstOrDefaultAsync(i => i.Id == invitationId)
        ?? throw new KeyNotFoundException("Invitation not found.");

    if (!string.Equals(invitation.Email, user.Email, StringComparison.OrdinalIgnoreCase))
      throw new UnauthorizedAccessException("This invitation does not belong to the current user.");

    invitation.RespondedAt = DateTime.UtcNow;
    invitation.ExpiresAt = DateTime.UtcNow;
    await _dbContext.SaveChangesAsync();
  }

  public async Task<IEnumerable<WorkspaceMemberDto>> GetMembersAsync(Guid workspaceId, string userId)
  {
    var canAccess = await _dbContext.Workspaces
        .AnyAsync(w => w.Id == workspaceId && (w.OwnerId == userId || w.ProjectManagerId == userId || w.Members.Any(m => m.UserId == userId)));
    if (!canAccess)
      throw new KeyNotFoundException("Workspace not found.");

    var members = await _dbContext.WorkspaceUsers
        .Include(wu => wu.User)
        .Where(wu => wu.WorkspaceId == workspaceId)
        .OrderBy(wu => wu.JoinedAt)
        .ToListAsync();

    return members.Select(_mapper.Map<WorkspaceMemberDto>).ToList();
  }

  public async Task RemoveMemberAsync(Guid workspaceId, string userIdToRemove, string ownerUserId)
  {
    var workspace = await _dbContext.Workspaces
        .FirstOrDefaultAsync(w => w.Id == workspaceId && w.OwnerId == ownerUserId)
        ?? throw new KeyNotFoundException("Workspace not found.");

    if (workspace.OwnerId == userIdToRemove)
      throw new InvalidOperationException("Workspace owner cannot be removed.");

    var member = await _dbContext.WorkspaceUsers
        .FirstOrDefaultAsync(wu => wu.WorkspaceId == workspaceId && wu.UserId == userIdToRemove)
        ?? throw new KeyNotFoundException("Workspace member not found.");

    _dbContext.WorkspaceUsers.Remove(member);

    var projectAssignments = await _dbContext.ProjectUsers
        .Where(pu => pu.UserId == userIdToRemove && pu.Project.WorkspaceId == workspaceId)
        .ToListAsync();
    _dbContext.ProjectUsers.RemoveRange(projectAssignments);

    await _dbContext.SaveChangesAsync();
  }

  private IQueryable<Workspace> WorkspaceQuery()
      => _dbContext.Workspaces
          .Include(w => w.Owner)
        .Include(w => w.ProjectManager)
          .Include(w => w.Members)
          .Include(w => w.Projects);
}
