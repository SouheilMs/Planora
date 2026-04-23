using System;

namespace Planora.Domain.Entities;

public class BacklogAttachment : BaseEntity
{
    public Guid BacklogItemId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;   // GUID filename on disk
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string UploadedById { get; set; } = string.Empty;

    // Navigation
    public BacklogItem BacklogItem { get; set; } = null!;
    public ApplicationUser UploadedBy { get; set; } = null!;
}