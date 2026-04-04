using FluentValidation;
using Planora.Application.DTOs.Sprints;

namespace Planora.Application.Validators;

public class CreateSprintValidator : AbstractValidator<CreateSprintDto>
{
    public CreateSprintValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate).WithMessage("End date must be after start date.");
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
