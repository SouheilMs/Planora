using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planora.Domain.Entities;

namespace Planora.Infrastructure.Data.Configurations;

public class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
  public void Configure(EntityTypeBuilder<Workspace> builder)
  {
    builder.HasKey(w => w.Id);
    builder.Property(w => w.Name).IsRequired().HasMaxLength(200);
    builder.Property(w => w.Description).HasMaxLength(1000);
    builder.HasIndex(w => w.Name);

    builder.HasOne(w => w.Owner)
        .WithMany(u => u.OwnedWorkspaces)
        .HasForeignKey(w => w.OwnerId)
        .OnDelete(DeleteBehavior.Restrict);

    builder.HasOne(w => w.ProjectManager)
      .WithMany()
      .HasForeignKey(w => w.ProjectManagerId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.HasQueryFilter(w => !w.IsDeleted);
  }
}
