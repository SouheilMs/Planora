using System;

namespace Planora.Domain.Entities;

public class BacklogLink : BaseEntity
{
	public Guid SourceItemId { get; set; }
	public Guid TargetItemId { get; set; }

	/// <summary>
	/// 0 = relates_to | 1 = blocks | 2 = is_blocked_by
	/// 3 = duplicates  | 4 = is_duplicated_by
	/// </summary>
	public int LinkType { get; set; } = 0;

	// Navigation
	public BacklogItem SourceItem { get; set; } = null!;
	public BacklogItem TargetItem { get; set; } = null!;
}