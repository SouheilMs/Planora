namespace Planora.Application.DTOs.Workspaces;

public class WorkspaceInviteableUserDto
{
  public string UserId { get; set; } = string.Empty;
  public string FullName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}

