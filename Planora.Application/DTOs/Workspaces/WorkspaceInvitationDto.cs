namespace Planora.Application.DTOs.Workspaces;

public class WorkspaceInvitationDto
{
  public Guid Id { get; set; }
  public Guid WorkspaceId { get; set; }
  public string WorkspaceName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string InvitedByUserId { get; set; } = string.Empty;
  public DateTime ExpiresAt { get; set; }
  public bool Accepted { get; set; }
  public DateTime CreatedAt { get; set; }
}
