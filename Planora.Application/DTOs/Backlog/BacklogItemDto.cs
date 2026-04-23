// Planora.Application.DTOs.Backlog.BacklogItemDto
using System;

namespace Planora.Application.DTOs.Backlog;

public class BacklogItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public int Status { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid? SprintId { get; set; }
    public string? SprintName { get; set; }
    public bool IsMovedToSprint { get; set; }
    public string AssignedToName { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public DateTime? DueDate { get; set; }
    public string? AssignedToId { get; set; }
    public int? Complexity { get; set; }
    public int? StoryPoints { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}