using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.Backlog;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;
using Planora.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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
        var items = await _dbContext.BacklogItems
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
            .Where(b => b.ProjectId == projectId && !b.IsDeleted)
            .OrderBy(b => b.Priority)
            .ToListAsync();

        return _mapper.Map<IEnumerable<BacklogItemDto>>(items);
    }

    // FIX: Include AssignedTo and Sprint so AutoMapper can resolve
    // AssignedToName and SprintName correctly
    public async Task<BacklogItemDto?> GetBacklogItemByIdAsync(Guid id)
    {
        var item = await _dbContext.BacklogItems
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

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
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.Title = string.IsNullOrWhiteSpace(dto.Title) ? backlogItem.Title : dto.Title.Trim();
        backlogItem.Description = dto.Description ?? string.Empty;
        backlogItem.Priority = dto.Priority;

        if (dto.AssignedToId != null)
        {
            backlogItem.AssignedToId = string.IsNullOrWhiteSpace(dto.AssignedToId)
                ? null
                : dto.AssignedToId;
        }

        if (dto.Complexity.HasValue)
        {
            backlogItem.Complexity = dto.Complexity.Value;
            backlogItem.StoryPoints = dto.Complexity.Value;
        }

        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Reload AssignedTo in case it changed
        await _dbContext.Entry(backlogItem).Reference(b => b.AssignedTo).LoadAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> UpdateAssignmentAsync(Guid id, string? assignedToId, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .Include(b => b.Sprint)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.AssignedToId = string.IsNullOrWhiteSpace(assignedToId) ? null : assignedToId;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // FIX: reload AssignedTo navigation after saving so mapper gets the name
        await _dbContext.Entry(backlogItem).Reference(b => b.AssignedTo).LoadAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> UpdatePriorityAsync(Guid id, int priority, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.Priority = priority;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> MoveToSprintAsync(Guid id, Guid sprintId, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.SprintId = sprintId;
        backlogItem.IsMovedToSprint = true;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Reload Sprint navigation after saving
        await _dbContext.Entry(backlogItem).Reference(b => b.Sprint).LoadAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task<BacklogItemDto> RemoveFromSprintAsync(Guid id, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .Include(b => b.AssignedTo)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.SprintId = null;
        backlogItem.IsMovedToSprint = false;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(backlogItem);
    }

    public async Task DeleteBacklogItemAsync(Guid id, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        backlogItem.IsDeleted = true;
        backlogItem.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    public async Task<BacklogItemDto> UpdateStatusAsync(Guid id, int status, string currentUserId)
    {
        var backlogItem = await _dbContext.BacklogItems
            .Include(b => b.Project)
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
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
            .Include(b => b.AssignedTo)
            .Include(b => b.Sprint)
            .FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("Backlog item not found.");

        await EnsureProjectMemberAccessAsync(backlogItem.ProjectId, currentUserId);

        // FIX: write to both fields — Complexity (XS/S/M/L/XL) and StoryPoints
        // (Fibonacci). The panel reads StoryPoints; the list displays both.
        backlogItem.Complexity = complexity;
        backlogItem.StoryPoints = complexity;
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

        var canAccess = project.Workspace.OwnerId == userId
            || project.ProjectManagerId == userId
            || isProjectMember
            || isWorkspaceMember;

        if (!canAccess)
            throw new UnauthorizedAccessException("Only project members can manage backlog items in this project.");
    }
}