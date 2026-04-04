using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Backlog;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Data;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
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

    public BacklogController(IBacklogService backlogService, ApplicationDbContext context, IMapper mapper)
    {
        _backlogService = backlogService;
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetBacklog(Guid projectId)
    {
        var result = await _backlogService.GetBacklogAsync(projectId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBacklogItem(Guid id)
    {
        var result = await _backlogService.GetBacklogItemByIdAsync(id);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Backlog item not found."));
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result));
    }

    [HttpPost]
    public async Task<IActionResult> CreateBacklogItem([FromBody] CreateBacklogItemDto dto)
    {
        var result = await _backlogService.CreateBacklogItemAsync(dto);
        return CreatedAtAction(nameof(GetBacklogItem), new { id = result.Id },
            ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item created successfully."));
    }

    [HttpPatch("{id:guid}/fields")]
    public async Task<IActionResult> UpdateFields(Guid id, [FromBody] UpdateBacklogFieldsDto dto)
    {
        var result = await _backlogService.UpdateFieldsAsync(id, dto);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Updated successfully."));
    }

    [HttpPatch("{id:guid}/priority")]
    public async Task<IActionResult> UpdatePriority(Guid id, [FromBody] int priority)
    {
        var result = await _backlogService.UpdatePriorityAsync(id, priority);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Priority updated."));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        var item = await _context.BacklogItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponseDto<object>.ErrorResult("Not found."));
        item.Status = dto.Status;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(_mapper.Map<BacklogItemDto>(item), "Status updated."));
    }

    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> AssignToUser(Guid id, [FromBody] AssignBacklogItemDto dto)
    {
        var item = await _context.BacklogItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponseDto<object>.ErrorResult("Not found."));
        item.AssignedToId = dto.AssignedToId;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(_mapper.Map<BacklogItemDto>(item), "Assigned."));
    }

    [HttpPatch("{id:guid}/complexity")]
    public async Task<IActionResult> UpdateComplexity(Guid id, [FromBody] int complexity)
    {
        var item = await _context.BacklogItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponseDto<object>.ErrorResult("Not found."));
        item.Complexity = complexity;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(_mapper.Map<BacklogItemDto>(item), "Complexity updated."));
    }

    [HttpPatch("{id:guid}/move-to-sprint/{sprintId:guid}")]
    public async Task<IActionResult> MoveToSprint(Guid id, Guid sprintId)
    {
        var item = await _context.BacklogItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponseDto<object>.ErrorResult("Not found."));
        var sprint = await _context.Sprints.FindAsync(sprintId);
        if (sprint == null) return NotFound(ApiResponseDto<object>.ErrorResult("Sprint not found."));
        item.SprintId = sprintId;
        item.IsMovedToSprint = true;
        item.Status = 0;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(_mapper.Map<BacklogItemDto>(item), "Moved to sprint."));
    }

    [HttpPatch("{id:guid}/remove-from-sprint")]
    public async Task<IActionResult> RemoveFromSprint(Guid id)
    {
        var result = await _backlogService.RemoveFromSprintAsync(id);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Removed from sprint."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBacklogItem(Guid id)
    {
        await _backlogService.DeleteBacklogItemAsync(id);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Deleted."));
    }

    [HttpGet("project/{projectId:guid}/all-items")]
    public async Task<IActionResult> GetAllBacklogItemsForProject(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var items = await _context.BacklogItems
            .Include(i => i.Sprint)
            .Include(i => i.SubTasks)
            .Include(i => i.Comments)
            .Where(i => i.ProjectId == projectId && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await _context.BacklogItems.CountAsync(i => i.ProjectId == projectId && !i.IsDeleted);
        var itemDtos = _mapper.Map<List<BacklogItemDto>>(items);
        var result = new PaginatedResultDto<BacklogItemDto> { Items = itemDtos, TotalCount = total, PageNumber = page, PageSize = pageSize };
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpGet("sprint/{sprintId:guid}")]
    public async Task<IActionResult> GetSprintBacklogItems(Guid sprintId)
    {
        var items = await _context.BacklogItems
            .Include(i => i.SubTasks)
            .Include(i => i.Comments)
            .Where(i => i.SprintId == sprintId && !i.IsDeleted)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();
        return Ok(ApiResponseDto<object>.SuccessResult(_mapper.Map<List<BacklogItemDto>>(items)));
    }

    // ===== SUBTASKS =====
    [HttpPost("{id:guid}/subtasks")]
    public async Task<IActionResult> AddSubTask(Guid id, [FromBody] CreateSubTaskDto dto)
    {
        var result = await _backlogService.AddSubTaskAsync(id, dto);
        return Ok(ApiResponseDto<BacklogSubTaskDto>.SuccessResult(result, "SubTask added."));
    }

    [HttpPatch("{id:guid}/subtasks/{subTaskId:guid}/toggle")]
    public async Task<IActionResult> ToggleSubTask(Guid id, Guid subTaskId)
    {
        var result = await _backlogService.ToggleSubTaskAsync(subTaskId);
        return Ok(ApiResponseDto<BacklogSubTaskDto>.SuccessResult(result));
    }

    [HttpDelete("{id:guid}/subtasks/{subTaskId:guid}")]
    public async Task<IActionResult> DeleteSubTask(Guid id, Guid subTaskId)
    {
        await _backlogService.DeleteSubTaskAsync(subTaskId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "SubTask deleted."));
    }

    // ===== COMMENTS =====
    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] AddBacklogCommentDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var result = await _backlogService.AddCommentAsync(id, dto, userId, userName);
        return Ok(ApiResponseDto<BacklogCommentDto>.SuccessResult(result, "Comment added."));
    }

    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        await _backlogService.DeleteCommentAsync(commentId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Comment deleted."));
    }
}