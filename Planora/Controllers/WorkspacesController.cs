using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Workspaces;
using Planora.Application.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetWorkspaces()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.GetAccessibleWorkspacesAsync(userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWorkspace(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.GetWorkspaceByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Workspace not found."));

        return Ok(ApiResponseDto<WorkspaceDto>.SuccessResult(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.CreateWorkspaceAsync(dto, userId);
        return CreatedAtAction(nameof(GetWorkspace), new { id = result.Id }, ApiResponseDto<WorkspaceDto>.SuccessResult(result, "Workspace created successfully."));
    }

    [HttpGet("{workspaceId:guid}/members")]
    public async Task<IActionResult> GetMembers(Guid workspaceId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.GetMembersAsync(workspaceId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpGet("{workspaceId:guid}/inviteable-users")]
    public async Task<IActionResult> GetInviteableUsers(Guid workspaceId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.GetInviteableUsersAsync(workspaceId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpPost("{workspaceId:guid}/invitations")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> InviteUser(Guid workspaceId, [FromBody] InviteWorkspaceUserDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.InviteUserAsync(workspaceId, dto, userId);
        return Ok(ApiResponseDto<WorkspaceInvitationDto>.SuccessResult(result, "Invitation sent successfully."));
    }

    [HttpGet("invitations/pending")]
    public async Task<IActionResult> GetPendingInvitations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _workspaceService.GetPendingInvitationsAsync(userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpPost("invitations/{invitationId:guid}/accept")]
    public async Task<IActionResult> AcceptInvitation(Guid invitationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _workspaceService.AcceptInvitationAsync(invitationId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Invitation accepted successfully."));
    }

    [HttpPost("invitations/{invitationId:guid}/reject")]
    public async Task<IActionResult> RejectInvitation(Guid invitationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _workspaceService.RejectInvitationAsync(invitationId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Invitation rejected successfully."));
    }

    [HttpDelete("{workspaceId:guid}/members/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveMember(Guid workspaceId, string userId)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerUserId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _workspaceService.RemoveMemberAsync(workspaceId, userId, ownerUserId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Member removed successfully."));
    }
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteWorkspace(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _workspaceService.DeleteWorkspaceAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Workspace deleted successfully."));
    }
}