using FluentValidation;
using Planora.Application.DTOs.Chatbot;

namespace Planora.Application.Validators;

public class ChatRequestValidator : AbstractValidator<ChatRequestDto>
{
    public ChatRequestValidator()
    {
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Context).MaximumLength(1000).When(x => x.Context != null);
    }
}
