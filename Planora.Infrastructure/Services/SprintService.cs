using AutoMapper;
using Planora.Application.DTOs.Sprints;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Enums;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class SprintService : ISprintService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SprintService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SprintDto>> GetSprintsAsync(Guid projectId)
    {
        var sprints = await _unitOfWork.Sprints.FindAsync(s => s.ProjectId == projectId);
        return sprints.Select(s =>
        {
            var dto = _mapper.Map<SprintDto>(s);
            var tasks = s.Tasks.ToList();
            dto.ProgressPercentage = tasks.Count > 0
                ? Math.Round((double)tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / tasks.Count * 100, 2)
                : 0;
            return dto;
        });
    }

    public async Task<SprintDto?> GetSprintByIdAsync(Guid id)
    {
        var sprint = await _unitOfWork.Sprints.GetByIdAsync(id);
        if (sprint == null) return null;

        var dto = _mapper.Map<SprintDto>(sprint);
        var tasks = sprint.Tasks.ToList();
        dto.ProgressPercentage = tasks.Count > 0
            ? Math.Round((double)tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done) / tasks.Count * 100, 2)
            : 0;
        return dto;
    }

    public async Task<SprintDto> CreateSprintAsync(CreateSprintDto dto)
    {
        var sprint = _mapper.Map<Sprint>(dto);
        sprint.Id = Guid.NewGuid();
        sprint.CreatedAt = DateTime.UtcNow;
        sprint.Status = SprintStatus.Planning;

        await _unitOfWork.Sprints.AddAsync(sprint);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<SprintDto>(sprint);
    }

    public async Task<SprintDto> UpdateSprintAsync(Guid id, UpdateSprintDto dto)
    {
        var sprint = await _unitOfWork.Sprints.GetByIdAsync(id) ?? throw new KeyNotFoundException("Sprint not found.");

        _mapper.Map(dto, sprint);
        sprint.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Sprints.Update(sprint);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<SprintDto>(sprint);
    }

    public async Task<SprintDto> CloseSprintAsync(Guid id)
    {
        var sprint = await _unitOfWork.Sprints.GetByIdAsync(id) ?? throw new KeyNotFoundException("Sprint not found.");
        sprint.Status = SprintStatus.Closed;
        sprint.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Sprints.Update(sprint);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<SprintDto>(sprint);
    }

    public async Task DeleteSprintAsync(Guid id)
    {
        var sprint = await _unitOfWork.Sprints.GetByIdAsync(id) ?? throw new KeyNotFoundException("Sprint not found.");
        sprint.IsDeleted = true;
        sprint.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Sprints.Update(sprint);
        await _unitOfWork.SaveChangesAsync();
    }
}
