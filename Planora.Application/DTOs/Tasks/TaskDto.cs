using Planora.Domain.Enums;

namespace Planora.Application.DTOs.Tasks;

public class TaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Domain.Enums.TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int ProgressPercentage { get; set; }
    public DateTime? DueDate { get; set; }
    public Guid ProjectId { get; set; }
    public string? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public Guid? SprintId { get; set; }
    public DateTime CreatedAt { get; set; }
}
