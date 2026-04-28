using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs.ChatInbox;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Infrastructure.Data;

namespace Planora.Infrastructure.Services;

public class ChatInboxService : IChatInboxService
{
  private readonly ApplicationDbContext _dbContext;

  public ChatInboxService(ApplicationDbContext dbContext)
  {
    _dbContext = dbContext;
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

    return await GetSessionByIdAsync(projectId, session.Id, userId);
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

    var session = await _dbContext.ChatSessions
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
      Content = content,
      CreatedAt = DateTime.UtcNow
    };

    session.UpdatedAt = DateTime.UtcNow;

    await _dbContext.ChatMessages.AddAsync(message);
    _dbContext.ChatSessions.Update(session);
    await _dbContext.SaveChangesAsync();

    await _dbContext.Entry(message).Reference(m => m.SenderUser).LoadAsync();
    return MapMessageDto(message);
  }

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
      CreatedByName = session.CreatedByUser != null ? $"{session.CreatedByUser.FirstName} {session.CreatedByUser.LastName}".Trim() : string.Empty,
      CreatedAt = session.CreatedAt,
      UpdatedAt = session.UpdatedAt,
      MessageCount = session.Messages.Count,
      LastMessageAt = lastMessage?.CreatedAt,
      LastMessageContent = lastMessage?.Content ?? string.Empty,
      LastMessageSenderName = lastMessage?.SenderUser != null ? $"{lastMessage.SenderUser.FirstName} {lastMessage.SenderUser.LastName}".Trim() : string.Empty
    };
  }

  private ChatMessageDto MapMessageDto(ChatMessage message)
      => new()
      {
        Id = message.Id,
        ChatSessionId = message.ChatSessionId,
        SenderUserId = message.SenderUserId,
        SenderName = message.SenderUser != null ? $"{message.SenderUser.FirstName} {message.SenderUser.LastName}".Trim() : string.Empty,
        Content = message.Content,
        CreatedAt = message.CreatedAt
      };
}