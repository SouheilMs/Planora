using FluentValidation;
using Planora.Application.DTOs.Workspaces;

namespace Planora.Application.Validators;

public class InviteWorkspaceUserValidator : AbstractValidator<InviteWorkspaceUserDto>
{
  public InviteWorkspaceUserValidator()
  {
    RuleFor(x => x.UserId).NotEmpty();
  }
}
