namespace Planora.Application.DTOs.Workspaces;

public class WorkspaceDto
{
  public Guid Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public string OwnerId { get; set; } = string.Empty;
  public string OwnerName { get; set; } = string.Empty;
  public string ProjectManagerId { get; set; } = string.Empty;
  public string ProjectManagerName { get; set; } = string.Empty;
  public int MemberCount { get; set; }
  public int ProjectCount { get; set; }
  public DateTime CreatedAt { get; set; }
}
