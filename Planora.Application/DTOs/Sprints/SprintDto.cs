// Planora.Application/DTOs/Sprints/SprintDto.cs
// ASSUREZ-VOUS QUE LE FICHIER CONTIENT EXACTEMENT CECI :

using System;

namespace Planora.Application.DTOs.Sprints
{
    public class SprintDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Goal { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public SprintStatus Status { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int TasksCount { get; set; }           // ⚠️ Cette ligne est CRUCIALE
        public int CompletedTasksCount { get; set; }  // ⚠️ Cette ligne est CRUCIALE
        public double ProgressPercentage { get; set; }
    }

    public enum SprintStatus
    {
        Planning = 0,
        Active = 1,
        Closed = 2
    }
}