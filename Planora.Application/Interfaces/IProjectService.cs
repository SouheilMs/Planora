using Planora.Application.DTOs.Projects;
using Planora.Application.DTOs.Common;

namespace Planora.Application.Interfaces;

public interface IProjectService
{
    Task<PaginatedResultDto<ProjectDto>> GetProjectsAsync(string userId, int page, int pageSize, string? search = null);
    Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId);
    Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, string projectManagerId);
    Task<ProjectDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId);
    Task DeleteProjectAsync(Guid id);
    Task AddMemberAsync(Guid projectId, string userId, string currentUserId);
    Task RemoveMemberAsync(Guid projectId, string userId, string currentUserId);
}
