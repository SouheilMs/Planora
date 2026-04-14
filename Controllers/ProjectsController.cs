using System.Security.Claims;
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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.GetProjectsAsync(userId, page, pageSize, search);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get project by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.GetProjectByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Project not found."));
        return Ok(ApiResponseDto<ProjectDto>.SuccessResult(result));
    }

    /// <summary>Create a new project</summary>
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.CreateProjectAsync(dto, userId);
        return CreatedAtAction(nameof(GetProject), new { id = result.Id }, ApiResponseDto<ProjectDto>.SuccessResult(result, "Project created successfully."));
    }

    /// <summary>Update a project</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.UpdateProjectAsync(id, dto, userId);
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
    public async Task<IActionResult> AddMember(Guid id, string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _projectService.AddMemberAsync(id, userId, currentUserId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Member added successfully."));
    }

    /// <summary>Remove member from project</summary>
    [HttpDelete("{id:guid}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid id, string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _projectService.RemoveMemberAsync(id, userId, currentUserId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Member removed successfully."));
    }

    /// <summary>Get inviteable workspace members for a project</summary>
    [HttpGet("{id:guid}/inviteable-members")]
    public async Task<IActionResult> GetInviteableMembers(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.GetInviteableUsersAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Invite a workspace member to a project</summary>
    [HttpPost("{id:guid}/invitations")]
    public async Task<IActionResult> InviteMember(Guid id, [FromBody] InviteProjectMemberDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.InviteMemberAsync(id, dto, userId);
        return Ok(ApiResponseDto<ProjectInvitationDto>.SuccessResult(result, "Invitation sent successfully."));
    }

    /// <summary>Get pending project invitations for the current user</summary>
    [HttpGet("invitations/pending")]
    public async Task<IActionResult> GetPendingInvitations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _projectService.GetPendingInvitationsAsync(userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Accept a project invitation</summary>
    [HttpPost("invitations/{invitationId:guid}/accept")]
    public async Task<IActionResult> AcceptInvitation(Guid invitationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _projectService.AcceptProjectInvitationAsync(invitationId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Invitation accepted successfully."));
    }

    /// <summary>Reject a project invitation</summary>
    [HttpPost("invitations/{invitationId:guid}/reject")]
    public async Task<IActionResult> RejectInvitation(Guid invitationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _projectService.RejectProjectInvitationAsync(invitationId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Invitation rejected successfully."));
    }
}
