using FluentValidation;
using Planora.Application.DTOs.Workspaces;

namespace Planora.Application.Validators;

public class InviteWorkspaceUserValidator : AbstractValidator<InviteWorkspaceUserDto>
{
    public InviteWorkspaceUserValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Role).NotEmpty().Must(role => role == "ProjectManager" || role == "Member")
            .WithMessage("Role must be either 'ProjectManager' or 'Member'");
    }
}