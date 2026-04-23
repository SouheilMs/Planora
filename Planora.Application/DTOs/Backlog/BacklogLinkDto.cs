using System;

public class BacklogLinkDto
{
    public Guid Id { get; set; }
    public Guid SourceItemId { get; set; }
    public Guid TargetItemId { get; set; }
    public string TargetItemTitle { get; set; } = string.Empty;
    public string TargetItemStatus { get; set; } = string.Empty;
    public int LinkType { get; set; }
    public string LinkTypeLabel { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
