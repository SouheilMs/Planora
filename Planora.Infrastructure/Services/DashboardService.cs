using Planora.Application.DTOs.Dashboard;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Data;
using Planora.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Planora.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _dbContext;

    public DashboardService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardDto> GetDashboardAsync(string? userId = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return new DashboardDto();
        }

        var visibleProjectIds = await _dbContext.Projects
            .Where(p => p.Workspace.OwnerId == userId || p.ProjectManagerId == userId || p.Users.Any(u => u.UserId == userId))
            .Select(p => p.Id)
            .ToListAsync();

        var projects = await _dbContext.Projects
            .Include(p => p.Tasks)
            .Where(p => visibleProjectIds.Contains(p.Id))
            .ToListAsync();

        var tasks = await _dbContext.Tasks
            .Where(t => visibleProjectIds.Contains(t.ProjectId))
            .ToListAsync();

        var sprints = await _dbContext.Sprints
            .Where(s => visibleProjectIds.Contains(s.ProjectId))
            .ToListAsync();

        var dto = new DashboardDto
        {
            TotalProjects = projects.Count,
            ActiveSprints = sprints.Count(s => s.Status == SprintStatus.Active),
            TotalTasks = tasks.Count,
            CompletedTasks = tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done),
            InProgressTasks = tasks.Count(t => t.Status == Domain.Enums.TaskStatus.InProgress),
            ToDoTasks = tasks.Count(t => t.Status == Domain.Enums.TaskStatus.ToDo),
            OverallProgressPercentage = tasks.Count > 0
                ? Math.Round((double)tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / tasks.Count * 100, 2)
                : 0,
            ProjectsProgress = projects.Select(p =>
            {
                var projectTasks = p.Tasks.ToList();
                return new ProjectProgressDto
                {
                    ProjectId = p.Id,
                    ProjectName = p.Name,
                    TotalTasks = projectTasks.Count,
                    CompletedTasks = projectTasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done),
                    ProgressPercentage = projectTasks.Count > 0
                        ? Math.Round((double)projectTasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / projectTasks.Count * 100, 2)
                        : 0
                };
            }).ToList()
        };

        return dto;
    }
}
