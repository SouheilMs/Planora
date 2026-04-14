using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planora.Domain.Entities;

namespace Planora.Infrastructure.Data.Configurations;

public class BacklogItemConfiguration : IEntityTypeConfiguration<BacklogItem>
{
    public void Configure(EntityTypeBuilder<BacklogItem> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Title).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Description).HasMaxLength(1000);
        builder.HasIndex(b => b.ProjectId);

        builder.HasOne(b => b.Project)
            .WithMany(p => p.BacklogItems)
            .HasForeignKey(b => b.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.AssignedTo)
            .WithMany(u => u.BacklogItems)
            .HasForeignKey(b => b.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(b => !b.IsDeleted);
    }
}
