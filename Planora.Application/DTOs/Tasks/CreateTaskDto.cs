using Planora.Domain.Enums;

namespace Planora.Application.DTOs.Tasks;

public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? DueDate { get; set; }
    public Guid ProjectId { get; set; }
    public string? AssignedToId { get; set; }
    public Guid? SprintId { get; set; }
}
