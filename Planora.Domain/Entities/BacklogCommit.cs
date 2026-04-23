using System;

namespace Planora.Domain.Entities;

public class BacklogCommit
{
    public Guid Id { get; set; }
    public Guid BacklogItemId { get; set; }
    public BacklogItem BacklogItem { get; set; } = null!;
    public Guid BranchId { get; set; }          // ← NOUVEAU
    public BacklogBranch Branch { get; set; } = null!;  // ← NOUVEAU
    public string Hash { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string CreatedById { get; set; } = string.Empty;
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
}