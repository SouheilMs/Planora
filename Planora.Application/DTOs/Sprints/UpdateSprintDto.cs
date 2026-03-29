// Planora.Application.DTOs.Sprints.UpdateSprintDto
using System;

namespace Planora.Application.DTOs.Sprints
{
    public class UpdateSprintDto
    {
        public string? Name { get; set; }
        public string? Goal { get; set; }
        public DateTime? StartDate { get; set; }  // ✅ DateTime? (nullable)
        public DateTime? EndDate { get; set; }    // ✅ DateTime? (nullable)
        public int? Status { get; set; }          // ✅ int? (nullable)
    }
}