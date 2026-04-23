using System;

namespace Planora.Domain.Entities;

public class WorkspaceInvitation
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string InvitedByUserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Accepted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public string Role { get; set; } = "Member"; 

    // Navigation properties
    public Workspace? Workspace { get; set; }
    public ApplicationUser? InvitedByUser { get; set; }
}