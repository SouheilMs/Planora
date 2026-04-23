using AutoMapper;
using Planora.Application.DTOs.Comments;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class CommentService : ICommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CommentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid taskId)
    {
        var comments = await _unitOfWork.Comments.FindAsync(c => c.TaskId == taskId);
        return _mapper.Map<IEnumerable<CommentDto>>(comments.OrderBy(c => c.CreatedAt));
    }

    public async Task<CommentDto> AddCommentAsync(CreateCommentDto dto, string authorId)
    {
        var comment = new Comment
        {
            Content = dto.Content,
            TaskId = dto.TaskId ?? Guid.Empty,        // cast Guid? → Guid
            BacklogItemId = dto.BacklogItemId,         // Guid? → Guid? (nullable ok)
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Comments.AddAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CommentDto>(comment);
    }

    public async Task DeleteCommentAsync(Guid id, string userId)
    {
        var comment = await _unitOfWork.Comments.GetByIdAsync(id) ?? throw new KeyNotFoundException("Comment not found.");
        if (comment.AuthorId != userId) throw new UnauthorizedAccessException("You cannot delete this comment.");

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Comments.Update(comment);
        await _unitOfWork.SaveChangesAsync();
    }
}