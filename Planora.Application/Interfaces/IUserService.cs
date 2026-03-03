using Planora.Application.DTOs.Users;
using Planora.Application.DTOs.Common;

namespace Planora.Application.Interfaces;

public interface IUserService
{
    Task<PaginatedResultDto<UserDto>> GetUsersAsync(int page, int pageSize, string? search = null);
    Task<UserDto?> GetUserByIdAsync(string id);
    Task<UserDto> UpdateUserAsync(string id, UpdateUserDto dto);
    Task DeleteUserAsync(string id);
    Task<UserDto> AssignRoleAsync(AssignRoleDto dto);
    Task<UserDto> ActivateUserAsync(string id);
    Task<UserDto> DeactivateUserAsync(string id);
}
