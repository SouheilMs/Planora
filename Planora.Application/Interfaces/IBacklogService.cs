using Planora.Application.DTOs.Backlog;

namespace Planora.Application.Interfaces;

public interface IBacklogService
{
    Task<IEnumerable<BacklogItemDto>> GetBacklogAsync(Guid projectId);
    Task<BacklogItemDto?> GetBacklogItemByIdAsync(Guid id);
    Task<BacklogItemDto> CreateBacklogItemAsync(CreateBacklogItemDto dto, string currentUserId);
    Task<BacklogItemDto> UpdateBacklogItemAsync(Guid id, UpdateBacklogItemDto dto, string currentUserId);
    Task<BacklogItemDto> UpdatePriorityAsync(Guid id, int priority, string currentUserId);
    Task<BacklogItemDto> UpdateStatusAsync(Guid id, int status, string currentUserId);
    Task<BacklogItemDto> UpdateAssignmentAsync(Guid id, string? assignedToId, string currentUserId);
    Task<BacklogItemDto> UpdateComplexityAsync(Guid id, int complexity, string currentUserId);
    Task<BacklogItemDto> MoveToSprintAsync(Guid id, Guid sprintId, string currentUserId);
    Task DeleteBacklogItemAsync(Guid id, string currentUserId);
    Task<BacklogItemDto> RemoveFromSprintAsync(Guid id, string currentUserId);
}
