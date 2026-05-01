namespace Planora.Domain.Entities;

public class ChatMessage : BaseEntity
{
  public Guid ChatSessionId { get; set; }
  public string? SenderUserId { get; set; }
  public bool IsAssistant { get; set; }
  public string Content { get; set; } = string.Empty;

  public ChatSession ChatSession { get; set; } = null!;
  public ApplicationUser? SenderUser { get; set; }
}