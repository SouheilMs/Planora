namespace Planora.Application.DTOs.Backlog;

public class CreateBacklogItemDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public Guid ProjectId { get; set; }
}
