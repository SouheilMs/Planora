namespace Planora.Application.DTOs.Backlog;

public class BacklogItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? SprintId { get; set; }
    public bool IsMovedToSprint { get; set; }
    public DateTime CreatedAt { get; set; }
}
