using System;
using System.Collections.Generic;

namespace Planora.Domain.Entities;

public class BacklogItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; } = 0;
    public int Status { get; set; } = 0;
    public Guid ProjectId { get; set; }
    public Guid? SprintId { get; set; }
    public string? AssignedToId { get; set; }
    public bool IsMovedToSprint { get; set; } = false;
    public int? Complexity { get; set; }
    public int? StoryPoints { get; set; }
    public DateTime? DueDate { get; set; }

    // Navigation
    public Project Project { get; set; } = null!;
    public Sprint? Sprint { get; set; }
    public ApplicationUser? AssignedTo { get; set; }
    public ICollection<SubTask> SubTasks { get; set; } = new List<SubTask>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}