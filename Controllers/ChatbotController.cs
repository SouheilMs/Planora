using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Chatbot;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;

    public ChatbotController(IChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    /// <summary>Send a message to the AI assistant</summary>
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto dto)
    {
        var response = await _chatbotService.GetResponseAsync(dto.Message, dto.Context);
        return Ok(ApiResponseDto<string>.SuccessResult(response));
    }
}
