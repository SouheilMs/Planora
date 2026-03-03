namespace Planora.Application.DTOs.Dashboard;

public class DashboardDto
{
    public int TotalProjects { get; set; }
    public int ActiveSprints { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int ToDoTasks { get; set; }
    public double OverallProgressPercentage { get; set; }
    public IList<ProjectProgressDto> ProjectsProgress { get; set; } = new List<ProjectProgressDto>();
}
