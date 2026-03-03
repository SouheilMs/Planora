using AutoMapper;
using Planora.Application.DTOs.Auth;
using Planora.Application.DTOs.Backlog;
using Planora.Application.DTOs.Comments;
using Planora.Application.DTOs.Projects;
using Planora.Application.DTOs.Sprints;
using Planora.Application.DTOs.Tasks;
using Planora.Application.DTOs.Users;
using Planora.Domain.Entities;

namespace Planora.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<ApplicationUser, UserDto>()
            .ForMember(dest => dest.Roles, opt => opt.Ignore());

        CreateMap<RegisterDto, ApplicationUser>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email));

        // Project mappings
        CreateMap<Project, ProjectDto>()
            .ForMember(dest => dest.ProjectManagerName, opt => opt.MapFrom(src =>
                src.ProjectManager != null
                    ? $"{src.ProjectManager.FirstName} {src.ProjectManager.LastName}"
                    : string.Empty))
            .ForMember(dest => dest.MemberCount, opt => opt.MapFrom(src => src.Members.Count))
            .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore());

        CreateMap<CreateProjectDto, Project>();
        CreateMap<UpdateProjectDto, Project>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // TaskItem mappings
        CreateMap<TaskItem, TaskDto>()
            .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src =>
                src.AssignedTo != null
                    ? $"{src.AssignedTo.FirstName} {src.AssignedTo.LastName}"
                    : null));

        CreateMap<CreateTaskDto, TaskItem>();
        CreateMap<UpdateTaskDto, TaskItem>();

        // Comment mappings
        CreateMap<Comment, CommentDto>()
            .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src =>
                src.Author != null
                    ? $"{src.Author.FirstName} {src.Author.LastName}"
                    : string.Empty));

        CreateMap<CreateCommentDto, Comment>();

        // Sprint mappings
        CreateMap<Sprint, SprintDto>()
            .ForMember(dest => dest.TaskCount, opt => opt.MapFrom(src => src.Tasks.Count))
            .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore());

        CreateMap<CreateSprintDto, Sprint>();
        CreateMap<UpdateSprintDto, Sprint>();

        // BacklogItem mappings
        CreateMap<BacklogItem, BacklogItemDto>();
        CreateMap<CreateBacklogItemDto, BacklogItem>();
    }
}
