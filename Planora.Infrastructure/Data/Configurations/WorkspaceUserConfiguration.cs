using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planora.Domain.Entities;

namespace Planora.Infrastructure.Data.Configurations;

public class WorkspaceUserConfiguration : IEntityTypeConfiguration<WorkspaceUser>
{
  public void Configure(EntityTypeBuilder<WorkspaceUser> builder)
  {
    builder.HasKey(wu => wu.Id);
    builder.HasIndex(wu => new { wu.WorkspaceId, wu.UserId }).IsUnique();

    builder.HasOne(wu => wu.Workspace)
        .WithMany(w => w.Members)
        .HasForeignKey(wu => wu.WorkspaceId)
        .OnDelete(DeleteBehavior.Cascade);

    builder.HasOne(wu => wu.User)
        .WithMany(u => u.WorkspaceUsers)
        .HasForeignKey(wu => wu.UserId)
        .OnDelete(DeleteBehavior.Restrict);

    builder.HasQueryFilter(wu => !wu.IsDeleted);
  }
}
