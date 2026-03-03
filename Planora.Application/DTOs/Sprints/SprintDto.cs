using Planora.Domain.Enums;

namespace Planora.Application.DTOs.Sprints;

public class SprintDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Goal { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public SprintStatus Status { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TaskCount { get; set; }
    public double ProgressPercentage { get; set; }
}
