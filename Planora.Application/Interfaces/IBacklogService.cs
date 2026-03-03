using Planora.Application.DTOs.Backlog;

namespace Planora.Application.Interfaces;

public interface IBacklogService
{
    Task<IEnumerable<BacklogItemDto>> GetBacklogAsync(Guid projectId);
    Task<BacklogItemDto?> GetBacklogItemByIdAsync(Guid id);
    Task<BacklogItemDto> CreateBacklogItemAsync(CreateBacklogItemDto dto);
    Task<BacklogItemDto> UpdatePriorityAsync(Guid id, int priority);
    Task<BacklogItemDto> MoveToSprintAsync(Guid id, Guid sprintId);
    Task DeleteBacklogItemAsync(Guid id);
}
