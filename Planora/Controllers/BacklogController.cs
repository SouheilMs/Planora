using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Backlog;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BacklogController : ControllerBase
{
    private readonly IBacklogService _backlogService;

    public BacklogController(IBacklogService backlogService)
    {
        _backlogService = backlogService;
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
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Backlog item not found."));
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result));
    }

    /// <summary>Create a backlog item</summary>
    [HttpPost]
    public async Task<IActionResult> CreateBacklogItem([FromBody] CreateBacklogItemDto dto)
    {
        var result = await _backlogService.CreateBacklogItemAsync(dto);
        return CreatedAtAction(nameof(GetBacklogItem), new { id = result.Id }, ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item created successfully."));
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
        var result = await _backlogService.MoveToSprintAsync(id, sprintId);
        return Ok(ApiResponseDto<BacklogItemDto>.SuccessResult(result, "Backlog item moved to sprint successfully."));
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
