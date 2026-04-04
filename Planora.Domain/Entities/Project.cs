namespace Planora.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string ProjectManagerId { get; set; } = string.Empty;

    // Navigation properties
    public ApplicationUser ProjectManager { get; set; } = null!;
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<BacklogItem> BacklogItems { get; set; } = new List<BacklogItem>();
}
