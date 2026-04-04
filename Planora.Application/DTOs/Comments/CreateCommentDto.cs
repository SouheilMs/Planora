namespace Planora.Application.DTOs.Comments;

public class CreateCommentDto
{
    public string Content { get; set; } = string.Empty;
    public Guid TaskId { get; set; }
}
