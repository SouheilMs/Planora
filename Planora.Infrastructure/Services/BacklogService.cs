using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.Backlog;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;
using Planora.Infrastructure.Data;

namespace Planora.Infrastructure.Services;

public class BacklogService : IBacklogService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _dbContext;

    public BacklogService(IUnitOfWork unitOfWork, IMapper mapper, ApplicationDbContext dbContext)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<BacklogItemDto>> GetBacklogAsync(Guid projectId)
    {
        var items = await _unitOfWork.BacklogItems.FindAsync(b => b.ProjectId == projectId);
        return _mapper.Map<IEnumerable<BacklogItemDto>>(items.OrderBy(b => b.Priority));
    }

    public async Task<BacklogItemDto?> GetBacklogItemByIdAsync(Guid id)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
        return item == null ? null : _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> CreateBacklogItemAsync(CreateBacklogItemDto dto, string currentUserId)
    {
        await EnsureProjectMemberAccessAsync(dto.ProjectId, currentUserId);

        var item = _mapper.Map<BacklogItem>(dto);
        item.Id = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;

        await _unitOfWork.BacklogItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> UpdateBacklogItemAsync(Guid id, UpdateBacklogItemDto dto, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.Title = string.IsNullOrWhiteSpace(dto.Title) ? backlogItem.Title : dto.Title.Trim();
        backlogItem.Description = dto.Description ?? string.Empty;
        backlogItem.Priority = dto.Priority;
        backlogItem.AssignedToId = string.IsNullOrWhiteSpace(dto.AssignedToId) ? null : dto.AssignedToId;
        if (dto.Complexity.HasValue)
        {
            backlogItem.Complexity = dto.Complexity.Value;
        }
        backlogItem.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> UpdateAssignmentAsync(Guid id, string? assignedToId, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.AssignedToId = string.IsNullOrWhiteSpace(assignedToId) ? null : assignedToId;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> UpdatePriorityAsync(Guid id, int priority, string currentUserId)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id) ?? throw new KeyNotFoundException("Backlog item not found.");
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        item.Priority = priority;
        item.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> MoveToSprintAsync(Guid id, Guid sprintId, string currentUserId)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id) ?? throw new KeyNotFoundException("Backlog item not found.");
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        item.SprintId = sprintId;
        item.IsMovedToSprint = true;
        item.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> RemoveFromSprintAsync(Guid id, string currentUserId)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Backlog item not found.");
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        item.SprintId = null;
        item.IsMovedToSprint = false;
        item.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task DeleteBacklogItemAsync(Guid id, string currentUserId)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id) ?? throw new KeyNotFoundException("Backlog item not found.");
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<BacklogItemDto> UpdateStatusAsync(Guid id, int status, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.Status = status;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> UpdateComplexityAsync(Guid id, int complexity, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.Complexity = complexity;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
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
            throw new UnauthorizedAccessException("Only project members can manage backlog items in this project.");
    }
}