using System;

namespace Planora.Domain.Entities;

public class BacklogWebLink : BaseEntity
{
    public Guid BacklogItemId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// 0 = web | 1 = video | 2 = document | 3 = book
    /// </summary>
    public int LinkType { get; set; } = 0;

    public string AddedById { get; set; } = string.Empty;

    // Navigation
    public BacklogItem BacklogItem { get; set; } = null!;
    public ApplicationUser AddedBy { get; set; } = null!;
}