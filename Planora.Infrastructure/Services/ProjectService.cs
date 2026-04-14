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
        var visibleProjects = ProjectQuery()
            .Where(p => p.ProjectManagerId == userId || p.Members.Any(m => m.UserId == userId));

        if (!string.IsNullOrWhiteSpace(search))
            visibleProjects = visibleProjects.Where(p => p.Name.Contains(search));

        var total = await visibleProjects.CountAsync();
        var projects = await visibleProjects
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = projects.Select(p =>
        {
            var dto = _mapper.Map<ProjectDto>(p);
            var tasks = p.Tasks.ToList();
            dto.ProgressPercentage = tasks.Count > 0
                ? Math.Round((double)tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / tasks.Count * 100, 2)
                : 0;
            return dto;
        });

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
        var project = await ProjectQuery()
            .FirstOrDefaultAsync(p => p.Id == id && (p.ProjectManagerId == userId || p.Members.Any(m => m.UserId == userId)));
        if (project == null) return null;

        var dto = _mapper.Map<ProjectDto>(project);
        var tasks = project.Tasks.ToList();
        dto.ProgressPercentage = tasks.Count > 0
            ? Math.Round((double)tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / tasks.Count * 100, 2)
            : 0;
        return dto;
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, string projectManagerId)
    {
        var projectManager = await _userManager.FindByIdAsync(projectManagerId)
            ?? throw new KeyNotFoundException("Authenticated user not found.");

        var project = _mapper.Map<Project>(dto);
        project.Id = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;
        project.ProjectManagerId = projectManager.Id;
        project.ProjectManager = projectManager;

        await _unitOfWork.Projects.AddAsync(project);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ProjectDto>(project);
    }

    public async Task<ProjectDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.ProjectManager)
            .Include(p => p.Members)
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id && p.ProjectManagerId == userId)
            ?? throw new KeyNotFoundException("Project not found.");

        var projectManagerId = project.ProjectManagerId;
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

    public async Task AddMemberAsync(Guid projectId, string userId, string currentUserId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.ProjectManagerId == currentUserId)
            ?? throw new KeyNotFoundException("Project not found.");

        var targetUser = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var exists = await _unitOfWork.ProjectMembers.ExistsAsync(pm => pm.ProjectId == project.Id && pm.UserId == userId);
        if (exists) throw new InvalidOperationException("User is already a member of this project.");

        var member = new ProjectMember
        {
            ProjectId = project.Id,
            UserId = targetUser.Id,
            JoinedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProjectMembers.AddAsync(member);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid projectId, string userId, string currentUserId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.ProjectManagerId == currentUserId)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.ProjectManagerId == userId)
            throw new InvalidOperationException("Project manager cannot be removed from the project.");

        var members = await _unitOfWork.ProjectMembers.FindAsync(pm => pm.ProjectId == project.Id && pm.UserId == userId);
        var member = members.FirstOrDefault() ?? throw new KeyNotFoundException("Member not found in project.");

        _unitOfWork.ProjectMembers.Delete(member);
        await _unitOfWork.SaveChangesAsync();
    }

    private IQueryable<Project> ProjectQuery()
        => _dbContext.Projects
            .Include(p => p.ProjectManager)
            .Include(p => p.Members)
            .Include(p => p.Tasks);
}
