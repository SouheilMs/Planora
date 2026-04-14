using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Sprints;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Enums;
using Planora.Infrastructure.Data;
using AutoMapper;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SprintsController : ControllerBase
{
    private readonly ISprintService _sprintService;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SprintsController(
        ISprintService sprintService,
        ApplicationDbContext context,
        IMapper mapper)
    {
        _sprintService = sprintService;
        _context = context;
        _mapper = mapper;
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
        if (result == null)
            return NotFound(ApiResponseDto<object>.ErrorResult("Sprint not found."));
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(result));
    }

    /// <summary>Create a new sprint</summary>
    [HttpPost]
    public async Task<IActionResult> CreateSprint([FromBody] CreateSprintDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _sprintService.CreateSprintAsync(dto, userId);
        return CreatedAtAction(nameof(GetSprint), new { id = result.Id },
            ApiResponseDto<SprintDto>.SuccessResult(result, "Sprint created successfully."));
    }

    /// <summary>Update a sprint</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSprint(Guid id, [FromBody] UpdateSprintDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _sprintService.UpdateSprintAsync(id, dto, userId);
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(result, "Sprint updated successfully."));
    }

    /// <summary>Close a sprint (set status to Closed)</summary>
    [HttpPatch("{id:guid}/close")]
    public async Task<IActionResult> CloseSprint(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var sprintDto = await _sprintService.CloseSprintAsync(id, userId);
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(sprintDto, "Sprint closed successfully."));
    }

    /// <summary>Delete a sprint</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSprint(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _sprintService.DeleteSprintAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Sprint deleted successfully."));
    }

    /// <summary>Start a sprint (set status to Active)</summary>
    [HttpPatch("{id:guid}/start")]
    public async Task<IActionResult> StartSprint(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var sprintDto = await _sprintService.StartSprintAsync(id, userId);
        return Ok(ApiResponseDto<SprintDto>.SuccessResult(sprintDto, "Sprint started successfully."));
    }

    /// <summary>Get completed sprints for a project</summary>
    [HttpGet("project/{projectId:guid}/completed")]
    public async Task<IActionResult> GetCompletedSprints(Guid projectId)
    {
        var result = await _sprintService.GetCompletedSprintsAsync(projectId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }
}