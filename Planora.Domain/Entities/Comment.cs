namespace Planora.Domain.Entities;

public class Comment : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public Guid? TaskId { get; set; }
    public Guid? BacklogItemId { get; set; }
    public string AuthorId { get; set; } = string.Empty;

    // Navigation properties
    public TaskItem? Task { get; set; }
    public BacklogItem? BacklogItem { get; set; }
    public ApplicationUser Author { get; set; } = null!;
}