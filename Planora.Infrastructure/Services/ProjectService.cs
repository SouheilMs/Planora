using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Projects;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly UserManager<ApplicationUser> _userManager;

    public ProjectService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _userManager = userManager;
    }

    public async Task<PaginatedResultDto<ProjectDto>> GetProjectsAsync(int page, int pageSize, string? search = null)
    {
        var allProjects = await _unitOfWork.Projects.GetAllAsync();
        var projectList = allProjects.ToList();

        if (!string.IsNullOrWhiteSpace(search))
            projectList = projectList.Where(p => p.Name.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

        var total = projectList.Count;
        var projects = projectList.Skip((page - 1) * pageSize).Take(pageSize);

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

    public async Task<ProjectDto?> GetProjectByIdAsync(Guid id)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id);
        if (project == null) return null;

        var dto = _mapper.Map<ProjectDto>(project);
        var tasks = project.Tasks.ToList();
        dto.ProgressPercentage = tasks.Count > 0
            ? Math.Round((double)tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / tasks.Count * 100, 2)
            : 0;
        return dto;
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto)
    {
        var project = _mapper.Map<Project>(dto);
        project.Id = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;

        await _unitOfWork.Projects.AddAsync(project);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ProjectDto>(project);
    }

    public async Task<ProjectDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id) ?? throw new KeyNotFoundException("Project not found.");

        _mapper.Map(dto, project);
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

    public async Task AddMemberAsync(Guid projectId, string userId)
    {
        var exists = await _unitOfWork.ProjectMembers.ExistsAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
        if (exists) throw new InvalidOperationException("User is already a member of this project.");

        var member = new ProjectMember
        {
            ProjectId = projectId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProjectMembers.AddAsync(member);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid projectId, string userId)
    {
        var members = await _unitOfWork.ProjectMembers.FindAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
        var member = members.FirstOrDefault() ?? throw new KeyNotFoundException("Member not found in project.");

        _unitOfWork.ProjectMembers.Delete(member);
        await _unitOfWork.SaveChangesAsync();
    }
}
