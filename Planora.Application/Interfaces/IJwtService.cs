using System.Security.Claims;
using Planora.Domain.Entities;

namespace Planora.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(ApplicationUser user, IList<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
