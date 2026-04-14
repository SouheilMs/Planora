namespace Planora.Application.DTOs.Projects;

public class ProjectDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string WorkspaceName { get; set; } = string.Empty;
    public string WorkspaceOwnerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string ProjectManagerId { get; set; } = string.Empty;
    public string ProjectManagerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int MemberCount { get; set; }
    public ICollection<ProjectMemberDto> Members { get; set; } = new List<ProjectMemberDto>();
    public double ProgressPercentage { get; set; }
}
