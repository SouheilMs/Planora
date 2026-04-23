// Planora.Application/DTOs/BacklogDev/BacklogCommitDto.cs
using System;

namespace Planora.Application.DTOs
{
    public class BacklogCommitDto
    {
        public Guid Id { get; set; }
        public Guid BacklogItemId { get; set; }
        public Guid BranchId { get; set; }       // ← ADD
        public string BranchName { get; set; } = string.Empty; // ← ADD
        public string Hash { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string CreatedById { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBacklogCommitRequest
    {
        public Guid BranchId { get; set; }        // ← ADD
        public string Hash { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
    
}