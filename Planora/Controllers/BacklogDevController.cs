// Planora.API/Controllers/BacklogDevController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Planora.Application.DTOs;
using Planora.Domain.Entities;
using Planora.Infrastructure.Data;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Planora.API.Controllers;

[ApiController]
[Route("api/backlog-items/{itemId}/dev")]
[Authorize]
public class BacklogDevController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public BacklogDevController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ══════════════════════════════════════════
    // BRANCHES
    // ══════════════════════════════════════════

    [HttpGet("branches")]
    public async Task<IActionResult> GetBranches(Guid itemId)
    {
        var branches = await _db.BacklogBranches
            .Where(b => b.BacklogItemId == itemId)
            .Include(b => b.CreatedBy)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BacklogBranchDto
            {
                Id = b.Id,
                BacklogItemId = b.BacklogItemId,
                BranchName = b.BranchName,
                CreatedById = b.CreatedById,
                CreatedByName = b.CreatedBy != null ? b.CreatedBy.FullName : "Inconnu",
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(new { success = true, data = branches });
    }

    [HttpPost("branches")]
    public async Task<IActionResult> AddBranch(Guid itemId, [FromBody] CreateBacklogBranchRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.BranchName))
            return BadRequest(new { success = false, message = "Le nom de branche est requis." });

        var item = await _db.BacklogItems.FindAsync(itemId);
        if (item == null) return NotFound(new { success = false, message = "Ticket introuvable." });

        var branch = new BacklogBranch
        {
            Id = Guid.NewGuid(),
            BacklogItemId = itemId,
            BranchName = req.BranchName.Trim(),
            CreatedById = UserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.BacklogBranches.Add(branch);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(UserId);
        var dto = new BacklogBranchDto
        {
            Id = branch.Id,
            BacklogItemId = branch.BacklogItemId,
            BranchName = branch.BranchName,
            CreatedById = branch.CreatedById,
            CreatedByName = user?.FullName ?? "Moi",
            CreatedAt = branch.CreatedAt
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpDelete("branches/{branchId}")]
    public async Task<IActionResult> DeleteBranch(Guid itemId, Guid branchId)
    {
        var branch = await _db.BacklogBranches
            .FirstOrDefaultAsync(b => b.Id == branchId && b.BacklogItemId == itemId);

        if (branch == null) return NotFound(new { success = false });

        branch.IsDeleted = true;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ══════════════════════════════════════════
    // COMMITS
    // ══════════════════════════════════════════

    [HttpPost("commits")]   // ← une seule fois
    public async Task<IActionResult> AddCommit(Guid itemId, [FromBody] CreateBacklogCommitRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Hash) || string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(new { success = false, message = "Hash et message sont requis." });

        var item = await _db.BacklogItems.FindAsync(itemId);
        if (item == null) return NotFound(new { success = false, message = "Ticket introuvable." });

        var branch = await _db.BacklogBranches
            .FirstOrDefaultAsync(b => b.Id == req.BranchId && b.BacklogItemId == itemId && !b.IsDeleted);
        if (branch == null)
            return BadRequest(new { success = false, message = "Branche introuvable pour ce ticket." });

        var commit = new BacklogCommit
        {
            Id = Guid.NewGuid(),
            BacklogItemId = itemId,
            BranchId = req.BranchId,
            Hash = req.Hash.Trim(),
            Message = req.Message.Trim(),
            CreatedById = UserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.BacklogCommits.Add(commit);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(UserId);
        var dto = new BacklogCommitDto
        {
            Id = commit.Id,
            BacklogItemId = commit.BacklogItemId,
            BranchId = commit.BranchId,
            BranchName = branch.BranchName,
            Hash = commit.Hash,
            Message = commit.Message,
            CreatedById = commit.CreatedById,
            CreatedByName = user?.FullName ?? "Moi",
            CreatedAt = commit.CreatedAt
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpDelete("commits/{commitId}")]
    public async Task<IActionResult> DeleteCommit(Guid itemId, Guid commitId)
    {
        var commit = await _db.BacklogCommits
            .FirstOrDefaultAsync(c => c.Id == commitId && c.BacklogItemId == itemId);

        if (commit == null) return NotFound(new { success = false });

        commit.IsDeleted = true;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
}