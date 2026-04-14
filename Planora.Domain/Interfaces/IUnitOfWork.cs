using Planora.Domain.Entities;

namespace Planora.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Workspace> Workspaces { get; }
    IRepository<WorkspaceUser> WorkspaceUsers { get; }
    IRepository<WorkspaceInvitation> WorkspaceInvitations { get; }
    IRepository<Project> Projects { get; }
    IRepository<ProjectUser> ProjectUsers { get; }
    IRepository<ProjectInvitation> ProjectInvitations { get; }
    IRepository<TaskItem> Tasks { get; }
    IRepository<Comment> Comments { get; }
    IRepository<Sprint> Sprints { get; }
    IRepository<BacklogItem> BacklogItems { get; }

    Task<int> SaveChangesAsync();
}
