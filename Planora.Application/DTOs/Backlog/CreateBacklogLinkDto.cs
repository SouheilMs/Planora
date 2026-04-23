// CreateBacklogLinkDto.cs
using System;

namespace Planora.Application.DTOs.Backlog;

public class CreateBacklogLinkDto
{
	public Guid TargetItemId { get; set; }
	public int LinkType { get; set; } = 0;
}