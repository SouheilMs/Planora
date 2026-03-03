using AutoMapper;
using Planora.Application.DTOs.Backlog;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;

namespace Planora.Infrastructure.Services;

public class BacklogService : IBacklogService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public BacklogService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<BacklogItemDto>> GetBacklogAsync(Guid projectId)
    {
        var items = await _unitOfWork.BacklogItems.FindAsync(b => b.ProjectId == projectId);
        return _mapper.Map<IEnumerable<BacklogItemDto>>(items.OrderBy(b => b.Priority));
    }

    public async Task<BacklogItemDto?> GetBacklogItemByIdAsync(Guid id)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
        return item == null ? null : _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> CreateBacklogItemAsync(CreateBacklogItemDto dto)
    {
        var item = _mapper.Map<BacklogItem>(dto);
        item.Id = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;

        await _unitOfWork.BacklogItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> UpdatePriorityAsync(Guid id, int priority)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id) ?? throw new KeyNotFoundException("Backlog item not found.");
        item.Priority = priority;
        item.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task<BacklogItemDto> MoveToSprintAsync(Guid id, Guid sprintId)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id) ?? throw new KeyNotFoundException("Backlog item not found.");
        item.SprintId = sprintId;
        item.IsMovedToSprint = true;
        item.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BacklogItemDto>(item);
    }

    public async Task DeleteBacklogItemAsync(Guid id)
    {
        var item = await _unitOfWork.BacklogItems.GetByIdAsync(id) ?? throw new KeyNotFoundException("Backlog item not found.");
        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.BacklogItems.Update(item);
        await _unitOfWork.SaveChangesAsync();
    }
}
