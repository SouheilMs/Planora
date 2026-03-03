using Planora.Domain.Entities;

namespace Planora.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Project> Projects { get; }
    IRepository<ProjectMember> ProjectMembers { get; }
    IRepository<TaskItem> Tasks { get; }
    IRepository<Comment> Comments { get; }
    IRepository<Sprint> Sprints { get; }
    IRepository<BacklogItem> BacklogItems { get; }

    Task<int> SaveChangesAsync();
}
