namespace Planora.Application.DTOs.Projects;

public class ProjectInvitationDto
{
  public Guid Id { get; set; }
  public Guid ProjectId { get; set; }
  public string ProjectName { get; set; } = string.Empty;
  public string UserId { get; set; } = string.Empty;
  public string UserFullName { get; set; } = string.Empty;
  public string UserEmail { get; set; } = string.Empty;
  public string InvitedByUserId { get; set; } = string.Empty;
  public string InvitedByFullName { get; set; } = string.Empty;
  public DateTime ExpiresAt { get; set; }
  public bool Accepted { get; set; }
  public DateTime CreatedAt { get; set; }
}
