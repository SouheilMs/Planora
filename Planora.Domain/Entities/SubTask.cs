using System;

namespace Planora.Domain.Entities;

public class SubTask : BaseEntity
{
	public string Title { get; set; } = string.Empty;
	public bool IsCompleted { get; set; } = false;
	public Guid BacklogItemId { get; set; }

	// Navigation
	public BacklogItem BacklogItem { get; set; } = null!;
}