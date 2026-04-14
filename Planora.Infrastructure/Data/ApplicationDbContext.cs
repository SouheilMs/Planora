using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Planora.Domain.Entities;

namespace Planora.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceUser> WorkspaceUsers => Set<WorkspaceUser>();
    public DbSet<WorkspaceInvitation> WorkspaceInvitations => Set<WorkspaceInvitation>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectUser> ProjectUsers => Set<ProjectUser>();
    public DbSet<ProjectInvitation> ProjectInvitations => Set<ProjectInvitation>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<BacklogItem> BacklogItems => Set<BacklogItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
