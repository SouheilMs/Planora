namespace Planora.Domain.Entities;

public class Workspace : BaseEntity
{
  public string Name { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public string OwnerId { get; set; } = string.Empty;
  public string ProjectManagerId { get; set; } = string.Empty;

  public ApplicationUser Owner { get; set; } = null!;
  public ApplicationUser ProjectManager { get; set; } = null!;
  public ICollection<WorkspaceUser> Members { get; set; } = new List<WorkspaceUser>();
  public ICollection<Project> Projects { get; set; } = new List<Project>();
  public ICollection<WorkspaceInvitation> Invitations { get; set; } = new List<WorkspaceInvitation>();
}