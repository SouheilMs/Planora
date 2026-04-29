namespace Planora.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody);
    Task SendWorkspaceInvitationAsync(string toEmail, string inviterName, string workspaceName, string role);
    Task SendProjectInvitationAsync(string toEmail, string inviterName, string projectName);
    Task SendWelcomeEmailAsync(string toEmail, string fullName);
}
