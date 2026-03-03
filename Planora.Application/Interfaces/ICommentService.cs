using Planora.Application.DTOs.Comments;

namespace Planora.Application.Interfaces;

public interface ICommentService
{
    Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid taskId);
    Task<CommentDto> AddCommentAsync(CreateCommentDto dto, string authorId);
    Task DeleteCommentAsync(Guid id, string userId);
}
