// Planora.Application/Interfaces/ITaskService.cs
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Tasks;

namespace Planora.Application.Interfaces;

public interface ITaskService
{
    Task<PaginatedResultDto<TaskDto>> GetTasksAsync(Guid projectId, int page, int pageSize);
    Task<TaskDto?> GetTaskByIdAsync(Guid id);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto);
    Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskDto dto);
    Task DeleteTaskAsync(Guid id);
    Task<PaginatedResultDto<TaskDto>> GetAllTasksAsync(int page, int pageSize);
    Task<PaginatedResultDto<TaskDto>> GetTasksByProjectIncludingClosedSprintsAsync(Guid projectId, int page, int pageSize);
}