using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planora.Domain.Entities;

namespace Planora.Infrastructure.Data.Configurations;

public class ProjectInvitationConfiguration : IEntityTypeConfiguration<ProjectInvitation>
{
    public void Configure(EntityTypeBuilder<ProjectInvitation> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.UserId).IsRequired().HasMaxLength(450);
        builder.Property(i => i.InvitedByUserId).IsRequired().HasMaxLength(450);
        builder.HasIndex(i => new { i.ProjectId, i.UserId, i.Accepted });

        builder.HasOne(i => i.Project)
            .WithMany()
            .HasForeignKey(i => i.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.User)
            .WithMany(u => u.ReceivedProjectInvitations)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.InvitedByUser)
            .WithMany(u => u.SentProjectInvitations)
            .HasForeignKey(i => i.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}