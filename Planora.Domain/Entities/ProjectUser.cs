namespace Planora.Domain.Entities;

public class ProjectUser : BaseEntity
{
  public Guid ProjectId { get; set; }
  public string UserId { get; set; } = string.Empty;
  public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

  public Project Project { get; set; } = null!;
  public ApplicationUser User { get; set; } = null!;
}