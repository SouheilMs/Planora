namespace Planora.Domain.Entities;

public class BacklogItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; } = 0;
    public Guid ProjectId { get; set; }
    public Guid? SprintId { get; set; }
    public bool IsMovedToSprint { get; set; } = false;

    // Navigation properties
    public Project Project { get; set; } = null!;
}
