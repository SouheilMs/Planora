using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Settings;
using System.Net;

namespace Planora.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost) ||
            string.IsNullOrWhiteSpace(_settings.SmtpUsername) ||
            string.IsNullOrWhiteSpace(_settings.SmtpPassword) ||
            string.IsNullOrWhiteSpace(_settings.SenderEmail))
        {
            _logger.LogWarning("Email settings are not configured. Skipping outbound email.");
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            var secureSocketOptions = _settings.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureSocketOptions);
            await client.AuthenticateAsync(_settings.SmtpUsername, _settings.SmtpPassword);
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via SMTP host {SmtpHost}.", _settings.SmtpHost);
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }

    public async Task SendWorkspaceInvitationAsync(string toEmail, string inviterName, string workspaceName, string role)
    {
        var encodedInviter = WebUtility.HtmlEncode(inviterName);
        var encodedWorkspace = WebUtility.HtmlEncode(workspaceName);
        var encodedRole = WebUtility.HtmlEncode(role);

        var subject = $"You've been invited to join the '{workspaceName}' workspace on Planora";
        var body = $"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>Workspace Invitation</h2>
              <p>Hello,</p>
              <p><strong>{encodedInviter}</strong> has invited you to join the workspace <strong>{encodedWorkspace}</strong> as a <strong>{encodedRole}</strong> on Planora.</p>
              <p>Log in to your Planora account to view and respond to this invitation.</p>
              <br/>
              <p style="color: #888; font-size: 12px;">This invitation expires in 7 days.</p>
            </body>
            </html>
            """;

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendProjectInvitationAsync(string toEmail, string inviterName, string projectName)
    {
        var encodedInviter = WebUtility.HtmlEncode(inviterName);
        var encodedProject = WebUtility.HtmlEncode(projectName);

        var subject = $"You've been invited to join the '{projectName}' project on Planora";
        var body = $"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>Project Invitation</h2>
              <p>Hello,</p>
              <p><strong>{encodedInviter}</strong> has invited you to join the project <strong>{encodedProject}</strong> on Planora.</p>
              <p>Log in to your Planora account to view and respond to this invitation.</p>
              <br/>
              <p style="color: #888; font-size: 12px;">This invitation expires in 7 days.</p>
            </body>
            </html>
            """;

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string fullName)
    {
        var encodedName = WebUtility.HtmlEncode(fullName);

        var subject = "Welcome to Planora!";
        var body = $"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>Welcome to Planora!</h2>
              <p>Hello <strong>{encodedName}</strong>,</p>
              <p>Your account has been successfully created. You can now log in and start collaborating with your team.</p>
              <p>We're excited to have you on board!</p>
            </body>
            </html>
            """;

        await SendEmailAsync(toEmail, subject, body);
    }
}
