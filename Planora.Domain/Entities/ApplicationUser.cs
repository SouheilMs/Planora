using Microsoft.AspNetCore.Identity;

namespace Planora.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Navigation properties
    public ICollection<ProjectUser> ProjectUsers { get; set; } = new List<ProjectUser>();
    public ICollection<WorkspaceUser> WorkspaceUsers { get; set; } = new List<WorkspaceUser>();
    public ICollection<Workspace> OwnedWorkspaces { get; set; } = new List<Workspace>();
    public ICollection<WorkspaceInvitation> SentWorkspaceInvitations { get; set; } = new List<WorkspaceInvitation>();
    public ICollection<ProjectInvitation> ReceivedProjectInvitations { get; set; } = new List<ProjectInvitation>();
    public ICollection<ProjectInvitation> SentProjectInvitations { get; set; } = new List<ProjectInvitation>();
    public ICollection<BacklogItem> BacklogItems { get; set; } = new List<BacklogItem>();
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Project> ManagedProjects { get; set; } = new List<Project>();
}
