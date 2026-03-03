using Planora.Application.DTOs.Dashboard;
using Planora.Application.Interfaces;
using Planora.Domain.Enums;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardDto> GetDashboardAsync(string? userId = null)
    {
        var projects = (await _unitOfWork.Projects.GetAllAsync()).ToList();
        var tasks = (await _unitOfWork.Tasks.GetAllAsync()).ToList();
        var sprints = (await _unitOfWork.Sprints.GetAllAsync()).ToList();

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
