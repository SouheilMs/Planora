// Planora.Application/DTOs/BacklogDev/BacklogBranchDto.cs
using System;

namespace Planora.Application.DTOs
{
    public class BacklogBranchDto
    {
        public Guid Id { get; set; }
        public Guid BacklogItemId { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string CreatedById { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBacklogBranchRequest
    {
        public string BranchName { get; set; } = string.Empty;
    }
}