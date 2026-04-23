namespace Planora.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid WorkspaceId { get; set; }
    public string ProjectManagerId { get; set; } = string.Empty;

    public Workspace Workspace { get; set; } = null!;
    public ApplicationUser ProjectManager { get; set; } = null!;
    public ICollection<ProjectUser> Users { get; set; } = new List<ProjectUser>();
    // SUPPRIMER ICollection<ProjectInvitation> — on invite au niveau workspace
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<BacklogItem> BacklogItems { get; set; } = new List<BacklogItem>();
}