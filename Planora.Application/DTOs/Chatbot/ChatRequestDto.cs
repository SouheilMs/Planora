namespace Planora.Application.DTOs.Chatbot;

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? Context { get; set; }
}
