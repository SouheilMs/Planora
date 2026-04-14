using FluentValidation;
using Planora.Application.DTOs.Workspaces;

namespace Planora.Application.Validators;

public class CreateWorkspaceValidator : AbstractValidator<CreateWorkspaceDto>
{
  public CreateWorkspaceValidator()
  {
    RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    RuleFor(x => x.Description).MaximumLength(1000);
  }
}
