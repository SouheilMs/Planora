using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Users;
using Planora.Application.Interfaces;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>Get all users with pagination</summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get user by ID</summary>
    [HttpGet("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetUser(string id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("User not found."));
        return Ok(ApiResponseDto<UserDto>.SuccessResult(result));
    }

    /// <summary>Update user</summary>
    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        var result = await _userService.UpdateUserAsync(id, dto);
        return Ok(ApiResponseDto<UserDto>.SuccessResult(result, "User updated successfully."));
    }

    /// <summary>Delete user</summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        await _userService.DeleteUserAsync(id);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "User deleted successfully."));
    }

    /// <summary>Assign role to user</summary>
    [HttpPost("assign-role")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
    {
        var result = await _userService.AssignRoleAsync(dto);
        return Ok(ApiResponseDto<UserDto>.SuccessResult(result, "Role assigned successfully."));
    }

    /// <summary>Activate user account</summary>
    [HttpPatch("{id}/activate")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ActivateUser(string id)
    {
        var result = await _userService.ActivateUserAsync(id);
        return Ok(ApiResponseDto<UserDto>.SuccessResult(result, "User activated successfully."));
    }

    /// <summary>Deactivate user account</summary>
    [HttpPatch("{id}/deactivate")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        var result = await _userService.DeactivateUserAsync(id);
        return Ok(ApiResponseDto<UserDto>.SuccessResult(result, "User deactivated successfully."));
    }
}
