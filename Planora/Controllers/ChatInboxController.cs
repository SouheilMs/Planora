using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.ChatInbox;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Planora.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/chat")]
[Authorize]
public class ChatInboxController : ControllerBase
{
    private readonly IChatInboxService _chatInboxService;

    public ChatInboxController(IChatInboxService chatInboxService)
    {
        _chatInboxService = chatInboxService;
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions(Guid projectId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _chatInboxService.GetSessionsAsync(projectId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession(Guid projectId, [FromBody] CreateChatSessionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _chatInboxService.CreateSessionAsync(projectId, dto, userId);
        return Ok(ApiResponseDto<ChatSessionDto>.SuccessResult(result, "Conversation created successfully."));
    }

    [HttpGet("sessions/{sessionId:guid}")]
    public async Task<IActionResult> GetSession(Guid projectId, Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _chatInboxService.GetSessionByIdAsync(projectId, sessionId, userId);
        return Ok(ApiResponseDto<ChatSessionDto>.SuccessResult(result));
    }

    [HttpGet("sessions/{sessionId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid projectId, Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _chatInboxService.GetMessagesAsync(projectId, sessionId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    [HttpPost("sessions/{sessionId:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid projectId, Guid sessionId, [FromBody] SendChatMessageDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _chatInboxService.SendMessageAsync(projectId, sessionId, dto, userId);
        return Ok(ApiResponseDto<ChatMessageDto>.SuccessResult(result, "Message sent successfully."));
    }

    [HttpDelete("sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid projectId, Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _chatInboxService.DeleteSessionAsync(projectId, sessionId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null, "Conversation supprimée."));
    }
}