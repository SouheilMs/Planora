using Planora.Application.DTOs.Projects;
using Planora.Application.DTOs.Common;

namespace Planora.Application.Interfaces;

public interface IProjectService
{
    Task<PaginatedResultDto<ProjectDto>> GetProjectsAsync(int page, int pageSize, string? search = null);
    Task<ProjectDto?> GetProjectByIdAsync(Guid id);
    Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto);
    Task<ProjectDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto);
    Task DeleteProjectAsync(Guid id);
    Task AddMemberAsync(Guid projectId, string userId);
    Task RemoveMemberAsync(Guid projectId, string userId);
}
