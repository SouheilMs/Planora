using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planora.Domain.Entities;

namespace Planora.Infrastructure.Data.Configurations;

public class ProjectUserConfiguration : IEntityTypeConfiguration<ProjectUser>
{
  public void Configure(EntityTypeBuilder<ProjectUser> builder)
  {
    builder.HasKey(pu => pu.Id);
    builder.HasIndex(pu => new { pu.ProjectId, pu.UserId }).IsUnique();

    builder.HasOne(pu => pu.Project)
        .WithMany(p => p.Users)
        .HasForeignKey(pu => pu.ProjectId)
        .OnDelete(DeleteBehavior.Cascade);

    builder.HasOne(pu => pu.User)
        .WithMany(u => u.ProjectUsers)
        .HasForeignKey(pu => pu.UserId)
        .OnDelete(DeleteBehavior.Restrict);

    builder.HasQueryFilter(pu => !pu.IsDeleted);
  }
}
