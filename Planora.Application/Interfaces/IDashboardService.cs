using Planora.Application.DTOs.Dashboard;

namespace Planora.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(string? userId = null);
}
