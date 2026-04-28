namespace Planora.Domain.Entities;

public class ChatSession : BaseEntity
{
  public Guid ProjectId { get; set; }
  public string Title { get; set; } = string.Empty;
  public string CreatedByUserId { get; set; } = string.Empty;

  public Project Project { get; set; } = null!;
  public ApplicationUser CreatedByUser { get; set; } = null!;
  public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}