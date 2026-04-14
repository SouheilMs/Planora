using Planora.Application.DTOs.Workspaces;

namespace Planora.Application.Interfaces;

public interface IWorkspaceService
{
  Task<IEnumerable<WorkspaceDto>> GetAccessibleWorkspacesAsync(string userId);
  Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid workspaceId, string userId);
  Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto dto, string ownerUserId);
  Task<IEnumerable<WorkspaceInviteableUserDto>> GetInviteableUsersAsync(Guid workspaceId, string userId);
  Task<WorkspaceInvitationDto> InviteUserAsync(Guid workspaceId, InviteWorkspaceUserDto dto, string ownerUserId);
  Task<WorkspaceDto> SetProjectManagerAsync(Guid workspaceId, SetWorkspaceProjectManagerDto dto, string ownerUserId);
  Task<IEnumerable<WorkspaceInvitationDto>> GetPendingInvitationsAsync(string userId);
  Task AcceptInvitationAsync(Guid invitationId, string userId);
  Task RejectInvitationAsync(Guid invitationId, string userId);
  Task<IEnumerable<WorkspaceMemberDto>> GetMembersAsync(Guid workspaceId, string userId);
  Task RemoveMemberAsync(Guid workspaceId, string userIdToRemove, string ownerUserId);
}
