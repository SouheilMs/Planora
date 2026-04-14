using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Backlog;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Data;
using AutoMapper;
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;


namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BacklogController : ControllerBase
{
    private readonly IBacklogService _backlogService;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public BacklogController(
        IBacklogService backlogService,
        ApplicationDbContext context,
        IMapper mapper)
    {
        _backlogService = backlogService;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>Get backlog for a project</summary>
    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetBacklog(Guid projectId)
    {
        var result = await _backlogService.GetBacklogAsync(projectId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get backlog item by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBacklogItem(Guid id)
    {
        var result = await _backlogService.GetBacklogItemByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponseDto<object>.ErrorResult("Backlog item not found."));
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result));
    }

    /// <summary>Create a backlog item</summary>
    [HttpPost]
    public async Task<IActionResult> CreateBacklogItem([FromBody] CreateBacklogItemDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.CreateBacklogItemAsync(dto, userId);
        return CreatedAtAction(nameof(GetBacklogItem), new { id = result.Id },
            ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item created successfully."));
    }

    /// <summary>Update a backlog item</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateBacklogItem(Guid id, [FromBody] UpdateBacklogItemDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.UpdateBacklogItemAsync(id, dto, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item updated successfully."));
    }

    /// <summary>Assign backlog item to a user</summary>
    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> AssignToUser(Guid id, [FromBody] AssignBacklogItemDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.UpdateAssignmentAsync(id, dto.AssignedToId, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Assigned successfully."));
    }

    /// <summary>Update backlog item priority</summary>
    [HttpPatch("{id:guid}/priority")]
    public async Task<IActionResult> UpdatePriority(Guid id, [FromBody] int priority)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.UpdatePriorityAsync(id, priority, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Priority updated successfully."));
    }

    /// <summary>Move backlog item to sprint</summary>
    [HttpPatch("{id:guid}/move-to-sprint/{sprintId:guid}")]
    public async Task<IActionResult> MoveToSprint(Guid id, Guid sprintId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.MoveToSprintAsync(id, sprintId, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Item moved to sprint successfully."));
    }

    /// <summary>Update backlog item status (for Kanban drag & drop)</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.UpdateStatusAsync(id, dto.Status, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Status updated successfully."));
    }

    /// <summary>Remove backlog item from sprint</summary>
    [HttpPatch("{id:guid}/remove-from-sprint")]
    public async Task<IActionResult> RemoveFromSprint(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.RemoveFromSprintAsync(id, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item removed from sprint successfully."));
    }
    /// <summary>Get all backlog items for a project (including those in sprints)</summary>
    // BacklogController.cs - méthode GetAllBacklogItemsForProject
    [HttpGet("project/{projectId:guid}/all-items")]
    public async Task<IActionResult> GetAllBacklogItemsForProject(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var items = await _context.BacklogItems
            .Include(i => i.Sprint)
            .Include(i => i.AssignedTo)
            .Where(i => i.ProjectId == projectId && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await _context.BacklogItems.CountAsync(i => i.ProjectId == projectId && !i.IsDeleted);

        var itemDtos = items.Select(item => new BacklogItemDto
        {
            Id = item.Id,
            Title = item.Title,
            Description = item.Description,
            Priority = item.Priority,
            Status = item.Status,
            ProjectId = item.ProjectId,
            SprintId = item.SprintId,
            SprintName = item.Sprint?.Name,
            IsMovedToSprint = item.IsMovedToSprint,
            AssignedToId = item.AssignedToId,
            AssignedToName = item.AssignedTo != null
                ? $"{item.AssignedTo.FirstName} {item.AssignedTo.LastName}".Trim()
                : string.Empty,
            Complexity = item.Complexity,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        }).ToList();

        var result = new PaginatedResultDto<BacklogItemDto>
        {
            Items = itemDtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };

        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Delete backlog item</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBacklogItem(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _backlogService.DeleteBacklogItemAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Backlog item deleted successfully."));
    }
    // BacklogController.cs - Ajouter cette méthode
    /// <summary>Get backlog items for a specific sprint</summary>
    [HttpGet("sprint/{sprintId:guid}")]
    public async Task<IActionResult> GetSprintBacklogItems(Guid sprintId)
    {
        var items = await _context.BacklogItems
            .Where(i => i.SprintId == sprintId)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();

        var itemDtos = _mapper.Map<IEnumerable<BacklogItemDto>>(items);
        return Ok(ApiResponseDto<object>.SuccessResult(itemDtos));
    }

    /// <summary>Update backlog item complexity (story points)</summary>
    [HttpPatch("{id:guid}/complexity")]
    public async Task<IActionResult> UpdateComplexity(Guid id, [FromBody] int complexity)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _backlogService.UpdateComplexityAsync(id, complexity, userId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Complexity updated successfully."));
    }
}