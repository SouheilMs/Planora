namespace Planora.Application.DTOs.Backlog;

public class UpdateBacklogItemDto
{
  public string Title { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public int Priority { get; set; }
  public string? AssignedToId { get; set; }
  public int? Complexity { get; set; }
}
