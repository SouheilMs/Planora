namespace Planora.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody);
    Task SendWorkspaceInvitationAsync(string toEmail, string inviterName, string workspaceName, string role);
    Task SendProjectInvitationAsync(string toEmail, string inviterName, string projectName);
    Task SendWelcomeEmailAsync(string toEmail, string fullName);
    Task SendTaskAssignmentAsync(string toEmail, string memberName, string taskTitle, string taskDescription, DateTime? dueDate, string priority, string projectName, string projectManagerName);
    Task SendProjectMemberAddedAsync(string toEmail, string memberName, string projectName, string workspaceName, string addedByName);
}
