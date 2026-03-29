using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Backlog;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Data;
using AutoMapper;
using System;
using System.Threading.Tasks;

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
        var result = await _backlogService.CreateBacklogItemAsync(dto);
        return CreatedAtAction(nameof(GetBacklogItem), new { id = result.Id },
            ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item created successfully."));
    }

    /// <summary>Update backlog item priority</summary>
    [HttpPatch("{id:guid}/priority")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> UpdatePriority(Guid id, [FromBody] int priority)
    {
        var result = await _backlogService.UpdatePriorityAsync(id, priority);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Priority updated successfully."));
    }

    /// <summary>Move backlog item to sprint</summary>
    [HttpPatch("{id:guid}/move-to-sprint/{sprintId:guid}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> MoveToSprint(Guid id, Guid sprintId)
    {
        var backlogItem = await _context.BacklogItems.FindAsync(id);
        if (backlogItem == null)
            return NotFound(ApiResponseDto<object>.ErrorResult("Backlog item not found."));

        var sprint = await _context.Sprints.FindAsync(sprintId);
        if (sprint == null)
            return NotFound(ApiResponseDto<object>.ErrorResult("Sprint not found."));

        backlogItem.SprintId = sprintId;
        backlogItem.Status = 0;
        backlogItem.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var backlogItemDto = _mapper.Map<BacklogItemDto>(backlogItem);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(backlogItemDto, "Item moved to sprint successfully."));
    }

    /// <summary>Update backlog item status (for Kanban drag & drop)</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        Console.WriteLine($"UpdateStatus - id: {id}, status: {dto.Status}");

        var backlogItem = await _context.BacklogItems.FindAsync(id);
        if (backlogItem == null)
            return NotFound(ApiResponseDto<object>.ErrorResult("Backlog item not found."));

        backlogItem.Status = dto.Status;
        backlogItem.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var backlogItemDto = _mapper.Map<BacklogItemDto>(backlogItem);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(backlogItemDto, "Status updated successfully."));
    }

    /// <summary>Remove backlog item from sprint</summary>
    [HttpPatch("{id:guid}/remove-from-sprint")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> RemoveFromSprint(Guid id)
    {
        var result = await _backlogService.RemoveFromSprintAsync(id);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item removed from sprint successfully."));
    }

    /// <summary>Delete backlog item</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> DeleteBacklogItem(Guid id)
    {
        await _backlogService.DeleteBacklogItemAsync(id);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Backlog item deleted successfully."));
    }
}