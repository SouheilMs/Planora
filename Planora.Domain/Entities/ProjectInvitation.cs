namespace Planora.Domain.Entities;

public class ProjectInvitation : BaseEntity
{
  public Guid ProjectId { get; set; }
  public string UserId { get; set; } = string.Empty;
  public string InvitedByUserId { get; set; } = string.Empty;
  public DateTime ExpiresAt { get; set; }
  public DateTime? RespondedAt { get; set; }
  public bool Accepted { get; set; }

  public Project Project { get; set; } = null!;
  public ApplicationUser User { get; set; } = null!;
  public ApplicationUser InvitedByUser { get; set; } = null!;
}
