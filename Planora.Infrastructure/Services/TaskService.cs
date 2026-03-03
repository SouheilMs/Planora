using AutoMapper;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Tasks;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public TaskService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedResultDto<TaskDto>> GetTasksAsync(Guid projectId, int page, int pageSize)
    {
        var (tasks, total) = await _unitOfWork.Tasks.GetPagedAsync(t => t.ProjectId == projectId, page, pageSize);
        var dtos = _mapper.Map<IEnumerable<TaskDto>>(tasks);

        return new PaginatedResultDto<TaskDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<TaskDto?> GetTaskByIdAsync(Guid id)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id);
        return task == null ? null : _mapper.Map<TaskDto>(task);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto)
    {
        var task = _mapper.Map<TaskItem>(dto);
        task.Id = Guid.NewGuid();
        task.CreatedAt = DateTime.UtcNow;
        task.Status = Domain.Enums.TaskStatus.ToDo;

        await _unitOfWork.Tasks.AddAsync(task);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<TaskDto>(task);
    }

    public async Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskDto dto)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id) ?? throw new KeyNotFoundException("Task not found.");

        _mapper.Map(dto, task);
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Tasks.Update(task);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<TaskDto>(task);
    }

    public async Task DeleteTaskAsync(Guid id)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id) ?? throw new KeyNotFoundException("Task not found.");
        task.IsDeleted = true;
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Tasks.Update(task);
        await _unitOfWork.SaveChangesAsync();
    }
}
