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
    public DbSet<SubTask> SubTasks => Set<SubTask>();
    public DbSet<BacklogLink> BacklogLinks { get; set; }
    public DbSet<BacklogAttachment> BacklogAttachments { get; set; }
    public DbSet<BacklogWebLink> BacklogWebLinks { get; set; }
    public DbSet<BacklogBranch> BacklogBranches { get; set; }
    public DbSet<BacklogCommit> BacklogCommits { get; set; }
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        builder.Entity<BacklogLink>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasQueryFilter(x => !x.IsDeleted);
            b.HasOne(x => x.SourceItem)
                .WithMany()
                .HasForeignKey(x => x.SourceItemId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.TargetItem)
                .WithMany()
                .HasForeignKey(x => x.TargetItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<BacklogAttachment>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasQueryFilter(x => !x.IsDeleted);
            b.HasOne(x => x.BacklogItem)
                .WithMany()
                .HasForeignKey(x => x.BacklogItemId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.UploadedBy)
                .WithMany()
                .HasForeignKey(x => x.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<BacklogWebLink>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasQueryFilter(x => !x.IsDeleted);
            b.HasOne(x => x.BacklogItem)
                .WithMany()
                .HasForeignKey(x => x.BacklogItemId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.AddedBy)
                .WithMany()
                .HasForeignKey(x => x.AddedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BacklogBranch>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasQueryFilter(x => !x.IsDeleted);
            b.HasOne(x => x.BacklogItem)
                .WithMany()
                .HasForeignKey(x => x.BacklogItemId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.CreatedBy)
                .WithMany()
                .HasForeignKey(x => x.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<BacklogCommit>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasQueryFilter(x => !x.IsDeleted);
            b.HasOne(x => x.BacklogItem)
                .WithMany()
                .HasForeignKey(x => x.BacklogItemId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Branch)          // ← NOUVEAU
                .WithMany(x => x.Commits)    // ← NOUVEAU
                .HasForeignKey(x => x.BranchId) // ← NOUVEAU
                .OnDelete(DeleteBehavior.Restrict); // ← NOUVEAU
            b.HasOne(x => x.CreatedBy)
                .WithMany()
                .HasForeignKey(x => x.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<Comment>(b =>
        {
            b.Property(c => c.Content)
             .HasColumnType("nvarchar(max)");
        });
    }
         
}