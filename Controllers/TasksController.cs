using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Tasks;
using Planora.Application.DTOs.Comments;
using Planora.Application.Interfaces;
using System.Security.Claims;

namespace Planora.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ICommentService _commentService;

    public TasksController(ITaskService taskService, ICommentService commentService)
    {
        _taskService = taskService;
        _commentService = commentService;
    }

    /// <summary>Get tasks for a project</summary>
    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetTasks(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _taskService.GetTasksAsync(projectId, page, pageSize);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get task by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTask(Guid id)
    {
        var result = await _taskService.GetTaskByIdAsync(id);
        if (result == null) return NotFound(ApiResponseDto<object>.ErrorResult("Task not found."));
        return Ok(ApiResponseDto<TaskDto>.SuccessResult(result));
    }

    /// <summary>Create a new task</summary>
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _taskService.CreateTaskAsync(dto, userId);
        return CreatedAtAction(nameof(GetTask), new { id = result.Id }, ApiResponseDto<TaskDto>.SuccessResult(result, "Task created successfully."));
    }

    /// <summary>Update a task</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        var result = await _taskService.UpdateTaskAsync(id, dto, userId);
        return Ok(ApiResponseDto<TaskDto>.SuccessResult(result, "Task updated successfully."));
    }

    /// <summary>Delete a task</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));

        await _taskService.DeleteTaskAsync(id, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Task deleted successfully."));
    }

    /// <summary>Get comments for a task</summary>
    [HttpGet("{taskId:guid}/comments")]
    public async Task<IActionResult> GetComments(Guid taskId)
    {
        var result = await _commentService.GetCommentsAsync(taskId);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Add a comment to a task</summary>
    [HttpPost("{taskId:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid taskId, [FromBody] CreateCommentDto dto)
    {
        dto.TaskId = taskId;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));
        var result = await _commentService.AddCommentAsync(dto, userId);
        return Ok(ApiResponseDto<CommentDto>.SuccessResult(result, "Comment added successfully."));
    }

    /// <summary>Get all tasks (no project filter)</summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAllTasks([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _taskService.GetAllTasksAsync(page, pageSize);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }

    /// <summary>Get tasks for a project including closed sprints</summary>
    [HttpGet("project/{projectId:guid}/all-tasks")]
    public async Task<IActionResult> GetTasksIncludingClosedSprints(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _taskService.GetTasksByProjectIncludingClosedSprintsAsync(projectId, page, pageSize);
        return Ok(ApiResponseDto<object>.SuccessResult(result));
    }
    /// <summary>Delete a comment</summary>
    [HttpDelete("{taskId:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid taskId, Guid commentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(ApiResponseDto<object>.ErrorResult("User not authenticated."));
        await _commentService.DeleteCommentAsync(commentId, userId);
        return Ok(ApiResponseDto<object>.SuccessResult(null!, "Comment deleted successfully."));
    }
}