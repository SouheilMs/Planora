using Planora.Domain.Entities;
using Planora.Domain.Interfaces;
using Planora.Infrastructure.Data;

namespace Planora.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public IRepository<Project> Projects { get; }
    public IRepository<ProjectMember> ProjectMembers { get; }
    public IRepository<TaskItem> Tasks { get; }
    public IRepository<Comment> Comments { get; }
    public IRepository<Sprint> Sprints { get; }
    public IRepository<BacklogItem> BacklogItems { get; }

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Projects = new Repository<Project>(context);
        ProjectMembers = new Repository<ProjectMember>(context);
        Tasks = new Repository<TaskItem>(context);
        Comments = new Repository<Comment>(context);
        Sprints = new Repository<Sprint>(context);
        BacklogItems = new Repository<BacklogItem>(context);
    }

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public void Dispose()
        => _context.Dispose();
}
