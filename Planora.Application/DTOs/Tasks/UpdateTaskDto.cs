using Planora.Domain.Enums;

namespace Planora.Application.DTOs.Tasks;

public class UpdateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Domain.Enums.TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int ProgressPercentage { get; set; }
    public DateTime? DueDate { get; set; }
    public string? AssignedToId { get; set; }
    public Guid? SprintId { get; set; }
}
