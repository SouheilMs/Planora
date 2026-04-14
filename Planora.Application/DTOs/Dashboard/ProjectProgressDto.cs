namespace Planora.Application.DTOs.Dashboard;

public class ProjectProgressDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string WorkspaceName { get; set; } = string.Empty;
    public double ProgressPercentage { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
}
