using Planora.Domain.Enums;

namespace Planora.Domain.Entities;

public class TaskItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Enums.TaskStatus Status { get; set; } = Enums.TaskStatus.ToDo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int ProgressPercentage { get; set; } = 0;
    public DateTime? DueDate { get; set; }
    public Guid ProjectId { get; set; }
    public string? AssignedToId { get; set; }
    public Guid? SprintId { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ApplicationUser? AssignedTo { get; set; }
    public Sprint? Sprint { get; set; }
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
