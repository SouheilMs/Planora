// Planora.Application.DTOs.Sprints.UpdateSprintDto
using System;

namespace Planora.Application.DTOs.Sprints
{
    public class UpdateSprintDto
    {
        public string? Name { get; set; }
        public string? Goal { get; set; }
        public DateTime? StartDate { get; set; }  
        public DateTime? EndDate { get; set; }   
        public int? Status { get; set; }         
    }
}