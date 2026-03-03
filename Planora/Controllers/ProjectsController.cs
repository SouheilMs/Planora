using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Projects;
using Planora.Application.Interfaces;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    /// <summary>Get all projects</summary>
    [HttpGet]
    public async Task<IActionResult> GetProjects([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var result = await _projectService.GetProjectsAsync(page, pageSize, search);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get project by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var result = await _projectService.GetProjectByIdAsync(id);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Project not found."));
        return Ok(ApiResponseDto<ProjectDto>.SuccessResult(result));
    }

    /// <summary>Create a new project</summary>
    [HttpPost]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
    {
        var result = await _projectService.CreateProjectAsync(dto);
        return CreatedAtAction(nameof(GetProject), new { id = result.Id }, ApiResponseDto<ProjectDto>.SuccessResult(result, "Project created successfully."));
    }

    /// <summary>Update a project</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto dto)
    {
        var result = await _projectService.UpdateProjectAsync(id, dto);
        return Ok(ApiResponseDto<ProjectDto>.SuccessResult(result, "Project updated successfully."));
    }

    /// <summary>Delete a project</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        await _projectService.DeleteProjectAsync(id);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Project deleted successfully."));
    }

    /// <summary>Add member to project</summary>
    [HttpPost("{id:guid}/members/{userId}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> AddMember(Guid id, string userId)
    {
        await _projectService.AddMemberAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Member added successfully."));
    }

    /// <summary>Remove member from project</summary>
    [HttpDelete("{id:guid}/members/{userId}")]
    [Authorize(Policy = "ProjectManagerOrAdmin")]
    public async Task<IActionResult> RemoveMember(Guid id, string userId)
    {
        await _projectService.RemoveMemberAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Member removed successfully."));
    }
}
