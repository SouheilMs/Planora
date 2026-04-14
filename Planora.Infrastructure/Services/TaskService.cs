// Planora.Infrastructure/Services/TaskService.cs
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Tasks;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;
using Planora.Infrastructure.Data;

namespace Planora.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _dbContext;

    public TaskService(IUnitOfWork unitOfWork, IMapper mapper, ApplicationDbContext dbContext)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _dbContext = dbContext;
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

    public async Task<PaginatedResultDto<TaskDto>> GetAllTasksAsync(int page, int pageSize)
    {
        var (tasks, total) = await _unitOfWork.Tasks.GetPagedAsync(t => !t.IsDeleted, page, pageSize);
        var dtos = _mapper.Map<IEnumerable<TaskDto>>(tasks);

        return new PaginatedResultDto<TaskDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PaginatedResultDto<TaskDto>> GetTasksByProjectIncludingClosedSprintsAsync(Guid projectId, int page, int pageSize)
    {
        var (tasks, total) = await _unitOfWork.Tasks.GetPagedAsync(
            t => t.ProjectId == projectId && !t.IsDeleted,
            page,
            pageSize);

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

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, string currentUserId)
    {
        await EnsureProjectMemberAccessAsync(dto.ProjectId, currentUserId);

        var task = _mapper.Map<TaskItem>(dto);
        task.Id = Guid.NewGuid();
        task.CreatedAt = DateTime.UtcNow;
        task.Status = Domain.Enums.TaskStatus.ToDo;

        await _unitOfWork.Tasks.AddAsync(task);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<TaskDto>(task);
    }

    public async Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskDto dto, string currentUserId)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id) ?? throw new KeyNotFoundException("Task not found.");
        await EnsureProjectMemberAccessAsync(task.ProjectId, currentUserId);

        _mapper.Map(dto, task);
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Tasks.Update(task);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<TaskDto>(task);
    }

    public async Task DeleteTaskAsync(Guid id, string currentUserId)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id) ?? throw new KeyNotFoundException("Task not found.");
        await EnsureProjectMemberAccessAsync(task.ProjectId, currentUserId);

        task.IsDeleted = true;
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Tasks.Update(task);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task EnsureProjectMemberAccessAsync(Guid projectId, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var isProjectMember = await _dbContext.ProjectUsers
            .AnyAsync(pu => pu.ProjectId == projectId && pu.UserId == userId);

        var isWorkspaceMember = await _dbContext.WorkspaceUsers
            .AnyAsync(wu => wu.WorkspaceId == project.WorkspaceId && wu.UserId == userId);

        var canAccess = project.Workspace.OwnerId == userId || project.ProjectManagerId == userId || isProjectMember || isWorkspaceMember;
        if (!canAccess)
            throw new UnauthorizedAccessException("Only project members can manage tasks in this project.");
    }
}