namespace Planora.Application.DTOs.ChatInbox;

public class ChatMessageDto
{
  public Guid Id { get; set; }
  public Guid ChatSessionId { get; set; }
  public string SenderUserId { get; set; } = string.Empty;
  public string SenderName { get; set; } = string.Empty;
  public string Content { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; }
}