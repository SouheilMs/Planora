using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Dashboard;
using Planora.Application.Interfaces;
using System.Security.Claims;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>Get dashboard statistics</summary>
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _dashboardService.GetDashboardAsync(userId);
        return Ok(ApiResponseDto<DashboardDto>.SuccessResult(result));
    }
}
