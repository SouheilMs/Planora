using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Sprints;
using Planora.Application.Interfaces;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SprintsController : ControllerBase
{
    private readonly ISprintService _sprintService;

    public SprintsController(ISprintService sprintService)
    {
        _sprintService = sprintService;
    }

    /// <summary>Get sprints for a project</summary>
    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetSprints(Guid projectId)
    {
        var result = await _sprintService.GetSprintsAsync(projectId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get sprint by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSprint(Guid id)
    {
        var result = await _sprintService.GetSprintByIdAsync(id);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Sprint not found."));
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(result));
    }

    /// <summary>Create a new sprint</summary>
    [HttpPost]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> CreateSprint([FromBody] CreateSprintDto dto)
    {
        var result = await _sprintService.CreateSprintAsync(dto);
        return CreatedAtAction(nameof(GetSprint), new { id = result.Id }, ApiResponseDto<SprintDto>.SuccessResult(result, "Sprint created successfully."));
    }

    /// <summary>Update a sprint</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> UpdateSprint(Guid id, [FromBody] UpdateSprintDto dto)
    {
        var result = await _sprintService.UpdateSprintAsync(id, dto);
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(result, "Sprint updated successfully."));
    }

    /// <summary>Close a sprint</summary>
    [HttpPatch("{id:guid}/close")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> CloseSprint(Guid id)
    {
        var result = await _sprintService.CloseSprintAsync(id);
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(result, "Sprint closed successfully."));
    }

    /// <summary>Delete a sprint</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> DeleteSprint(Guid id)
    {
        await _sprintService.DeleteSprintAsync(id);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Sprint deleted successfully."));
    }
}
