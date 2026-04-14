namespace Planora.Domain.Entities;

public class WorkspaceInvitation : BaseEntity
{
  public Guid WorkspaceId { get; set; }
  public string Email { get; set; } = string.Empty;
  public string InvitedByUserId { get; set; } = string.Empty;
  public string Token { get; set; } = Guid.NewGuid().ToString("N");
  public DateTime ExpiresAt { get; set; }
  public DateTime? RespondedAt { get; set; }
  public bool Accepted { get; set; }

  public Workspace Workspace { get; set; } = null!;
  public ApplicationUser InvitedByUser { get; set; } = null!;
}