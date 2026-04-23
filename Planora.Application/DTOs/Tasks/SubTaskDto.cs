using System;

namespace Planora.Application.DTOs.Backlog;

public class SubTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public Guid BacklogItemId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSubTaskDto
{
    public string Title { get; set; } = string.Empty;
}

public class UpdateSubTaskDto
{
    public string? Title { get; set; }
    public bool? IsCompleted { get; set; }
}