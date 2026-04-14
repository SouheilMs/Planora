using Planora.Application.DTOs.Projects;
using Planora.Application.DTOs.Common;

namespace Planora.Application.Interfaces;

public interface IProjectService
{
    Task<PaginatedResultDto<ProjectDto>> GetProjectsAsync(string userId, int page, int pageSize, string? search = null);
    Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId);
    Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, string currentUserId);
    Task<ProjectDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId);
    Task DeleteProjectAsync(Guid id);
    Task AddMemberAsync(Guid projectId, string userIdToAssign, string currentUserId);
    Task RemoveMemberAsync(Guid projectId, string userIdToRemove, string currentUserId);
    Task<IEnumerable<ProjectInviteableUserDto>> GetInviteableUsersAsync(Guid projectId, string userId);
    Task<ProjectInvitationDto> InviteMemberAsync(Guid projectId, InviteProjectMemberDto dto, string userId);
    Task<IEnumerable<ProjectInvitationDto>> GetPendingInvitationsAsync(string userId);
    Task AcceptProjectInvitationAsync(Guid invitationId, string userId);
    Task RejectProjectInvitationAsync(Guid invitationId, string userId);
}
