using Planora.Application.DTOs.Tasks;
using Planora.Application.DTOs.Common;

namespace Planora.Application.Interfaces;

public interface ITaskService
{
    Task<PaginatedResultDto<TaskDto>> GetTasksAsync(Guid projectId, int page, int pageSize);
    Task<TaskDto?> GetTaskByIdAsync(Guid id);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto);
    Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskDto dto);
    Task DeleteTaskAsync(Guid id);
}
