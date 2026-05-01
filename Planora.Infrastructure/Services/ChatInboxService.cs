using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.ChatInbox;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Planora.Infrastructure.Services;

public class ChatInboxService : IChatInboxService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IChatbotService _chatbotService;
    private readonly IHubClients _hubClients;

    public ChatInboxService(
        ApplicationDbContext dbContext,
        IChatbotService chatbotService,
        IHubClients hubClients)
    {
        _dbContext = dbContext;
        _chatbotService = chatbotService;
        _hubClients = hubClients;
    }

    public async Task<IEnumerable<ChatSessionDto>> GetSessionsAsync(Guid projectId, string userId)
    {
        await EnsureProjectMemberAsync(projectId, userId);

        var sessions = await _dbContext.ChatSessions
            .Include(s => s.CreatedByUser)
            .Include(s => s.Messages)
                .ThenInclude(m => m.SenderUser)
            .Where(s => s.ProjectId == projectId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sessions.Select(MapSessionDto).ToList();
    }

    // ✅ Version unique avec broadcast SignalR
    public async Task<ChatSessionDto> CreateSessionAsync(Guid projectId, CreateChatSessionDto dto, string userId)
    {
        await EnsureProjectMemberAsync(projectId, userId);

        var title = dto.Title.Trim();
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Session title is required.");

        var session = new ChatSession
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Title = title,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _dbContext.ChatSessions.AddAsync(session);
        await _dbContext.SaveChangesAsync();

        var sessionDto = await GetSessionByIdAsync(projectId, session.Id, userId);

        // ✅ Notifier tous les membres du projet en temps réel
        await _hubClients
            .Group($"project_{projectId}")
            .SendAsync("SessionCreated", sessionDto);

        return sessionDto;
    }

    public async Task<ChatSessionDto> GetSessionByIdAsync(Guid projectId, Guid sessionId, string userId)
    {
        await EnsureProjectMemberAsync(projectId, userId);

        var session = await SessionQuery()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.ProjectId == projectId)
            ?? throw new KeyNotFoundException("Chat session not found.");

        return MapSessionDto(session);
    }

    public async Task<IEnumerable<ChatMessageDto>> GetMessagesAsync(Guid projectId, Guid sessionId, string userId)
    {
        await EnsureProjectMemberAsync(projectId, userId);

        var sessionExists = await _dbContext.ChatSessions
            .AnyAsync(s => s.Id == sessionId && s.ProjectId == projectId);

        if (!sessionExists)
            throw new KeyNotFoundException("Chat session not found.");

        var messages = await _dbContext.ChatMessages
            .Include(m => m.SenderUser)
            .Where(m => m.ChatSessionId == sessionId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return messages.Select(MapMessageDto).ToList();
    }

    public async Task<ChatMessageDto> SendMessageAsync(Guid projectId, Guid sessionId, SendChatMessageDto dto, string userId)
    {
        await EnsureProjectMemberAsync(projectId, userId);

        var session = await SessionQuery()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.ProjectId == projectId)
            ?? throw new KeyNotFoundException("Chat session not found.");

        var content = dto.Content.Trim();
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Message content is required.");

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatSessionId = session.Id,
            SenderUserId = userId,
            IsAssistant = false,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        session.UpdatedAt = DateTime.UtcNow;

        await _dbContext.ChatMessages.AddAsync(message);
        await _dbContext.SaveChangesAsync();

        await _dbContext.Entry(message).Reference(m => m.SenderUser).LoadAsync();

        // ✅ Broadcast message utilisateur en temps réel
        var messageDto = MapMessageDto(message);
        await _hubClients.Group(sessionId.ToString())
                         .SendAsync("ReceiveMessage", messageDto);

        if (ShouldInvokeAssistant(content))
        {
            var prompt = ExtractAssistantPrompt(content);
            var transcriptSession = await SessionQuery()
                .FirstAsync(s => s.Id == session.Id);
            var transcript = BuildSessionTranscript(transcriptSession);
            var assistantResponse = await _chatbotService.GetResponseAsync(prompt, transcript);

            if (!string.IsNullOrWhiteSpace(assistantResponse))
            {
                var assistantMessage = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    ChatSessionId = session.Id,
                    SenderUserId = null,
                    IsAssistant = true,
                    Content = assistantResponse.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                session.UpdatedAt = assistantMessage.CreatedAt;
                await _dbContext.ChatMessages.AddAsync(assistantMessage);
                await _dbContext.SaveChangesAsync();

                // ✅ Broadcast message IA en temps réel
                var assistantDto = MapMessageDto(assistantMessage);
                await _hubClients.Group(sessionId.ToString())
                      .SendAsync("ReceiveMessage", assistantDto);
            }
        }

        return messageDto;
    }

    public async Task DeleteSessionAsync(Guid projectId, Guid sessionId, string userId)
    {
        await EnsureProjectMemberAsync(projectId, userId);

        var session = await _dbContext.ChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.ProjectId == projectId)
            ?? throw new KeyNotFoundException("Chat session not found.");

        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var isProjectManager = project.ProjectManagerId == userId;
        var isCreator = session.CreatedByUserId == userId;

        if (!isCreator && !isProjectManager)
            throw new UnauthorizedAccessException("Only the session creator or project manager can delete it.");

        _dbContext.ChatMessages.RemoveRange(session.Messages);
        _dbContext.ChatSessions.Remove(session);
        await _dbContext.SaveChangesAsync();

        // ✅ Notifier tous les membres du projet en temps réel
        await _hubClients
            .Group($"project_{projectId}")
            .SendAsync("SessionDeleted", sessionId.ToString());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private IQueryable<ChatSession> SessionQuery()
        => _dbContext.ChatSessions
            .Include(s => s.CreatedByUser)
            .Include(s => s.Messages)
                .ThenInclude(m => m.SenderUser);

    private async Task EnsureProjectMemberAsync(Guid projectId, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Users)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var isProjectMember = project.Users.Any(u => u.UserId == userId) || project.ProjectManagerId == userId;
        if (!isProjectMember)
            throw new UnauthorizedAccessException("Only project members can access the inbox.");
    }

    private ChatSessionDto MapSessionDto(ChatSession session)
    {
        var lastMessage = session.Messages
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefault();

        return new ChatSessionDto
        {
            Id = session.Id,
            ProjectId = session.ProjectId,
            Title = session.Title,
            CreatedByUserId = session.CreatedByUserId,
            CreatedByName = session.CreatedByUser != null
                ? $"{session.CreatedByUser.FirstName} {session.CreatedByUser.LastName}".Trim()
                : string.Empty,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt,
            MessageCount = session.Messages.Count,
            LastMessageAt = lastMessage?.CreatedAt,
            LastMessageContent = lastMessage?.Content ?? string.Empty,
            LastMessageSenderName = lastMessage?.IsAssistant == true
                ? "Planora AI"
                : lastMessage?.SenderUser != null
                    ? $"{lastMessage.SenderUser.FirstName} {lastMessage.SenderUser.LastName}".Trim()
                    : string.Empty,
            LastMessageIsAssistant = lastMessage?.IsAssistant ?? false
        };
    }

    private ChatMessageDto MapMessageDto(ChatMessage message)
        => new()
        {
            Id = message.Id,
            ChatSessionId = message.ChatSessionId,
            SenderUserId = message.SenderUserId ?? string.Empty,
            SenderName = message.IsAssistant
                ? "Planora AI"
                : message.SenderUser != null
                    ? $"{message.SenderUser.FirstName} {message.SenderUser.LastName}".Trim()
                    : string.Empty,
            IsAssistant = message.IsAssistant,
            Content = message.Content,
            CreatedAt = message.CreatedAt
        };

    private static bool ShouldInvokeAssistant(string content)
        => content.TrimStart().StartsWith("@chat", StringComparison.OrdinalIgnoreCase);

    private static string ExtractAssistantPrompt(string content)
    {
        var trimmed = content.Trim();
        var prompt = trimmed.Length > 5 ? trimmed[5..].Trim() : string.Empty;
        return string.IsNullOrWhiteSpace(prompt)
            ? "Review the session and help the team with the issue discussed here."
            : prompt;
    }

    private static string BuildSessionTranscript(ChatSession session)
    {
        var lines = session.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m =>
            {
                var senderName = m.IsAssistant
                    ? "Planora AI"
                    : m.SenderUser != null
                        ? $"{m.SenderUser.FirstName} {m.SenderUser.LastName}".Trim()
                        : "Unknown";

                return $"[{m.CreatedAt:yyyy-MM-dd HH:mm}] {senderName}: {m.Content}";
            });

        return string.Join(Environment.NewLine, lines);
    }
}