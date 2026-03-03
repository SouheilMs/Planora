using Planora.Application.DTOs.Sprints;

namespace Planora.Application.Interfaces;

public interface ISprintService
{
    Task<IEnumerable<SprintDto>> GetSprintsAsync(Guid projectId);
    Task<SprintDto?> GetSprintByIdAsync(Guid id);
    Task<SprintDto> CreateSprintAsync(CreateSprintDto dto);
    Task<SprintDto> UpdateSprintAsync(Guid id, UpdateSprintDto dto);
    Task<SprintDto> CloseSprintAsync(Guid id);
    Task DeleteSprintAsync(Guid id);
}
