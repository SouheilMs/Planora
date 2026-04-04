using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Auth;
using Planora.Application.DTOs.Common;
using Planora.Application.Interfaces;
using System.Security.Claims;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Register a new user</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponseDto<AuthResponseDto>), 200)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return Ok(ApiResponseDto<AuthResponseDto>.SuccessResult(result, "Registration successful."));
    }

    /// <summary>Login with credentials</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponseDto<AuthResponseDto>), 200)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(ApiResponseDto<AuthResponseDto>.SuccessResult(result, "Login successful."));
    }

    /// <summary>Refresh access token</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto);
        return Ok(ApiResponseDto<AuthResponseDto>.SuccessResult(result, "Token refreshed successfully."));
    }

    /// <summary>Logout current user</summary>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));
        await _authService.LogoutAsync(userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Logged out successfully."));
    }
}
