namespace Planora.Domain.Entities;

public class WorkspaceUser : BaseEntity
{
  public Guid WorkspaceId { get; set; }
  public string UserId { get; set; } = string.Empty;
  public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

  public Workspace Workspace { get; set; } = null!;
  public ApplicationUser User { get; set; } = null!;
}