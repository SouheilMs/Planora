// Planora.Application/Mappings/MappingProfile.cs
using AutoMapper;
using Planora.Application.DTOs.Auth;
using Planora.Application.DTOs.Backlog;
using Planora.Application.DTOs.Comments;
using Planora.Application.DTOs.Projects;
using Planora.Application.DTOs.Sprints;
using Planora.Application.DTOs.Tasks;
using Planora.Application.DTOs.Users;
using Planora.Application.DTOs.Workspaces;
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
            .ForMember(dest => dest.WorkspaceName, opt => opt.MapFrom(src => src.Workspace.Name))
            .ForMember(dest => dest.WorkspaceOwnerId, opt => opt.MapFrom(src => src.Workspace.OwnerId))
            .ForMember(dest => dest.ProjectManagerName, opt => opt.MapFrom(src =>
                src.ProjectManager != null
                    ? $"{src.ProjectManager.FirstName} {src.ProjectManager.LastName}"
                    : string.Empty))
            .ForMember(dest => dest.MemberCount, opt => opt.MapFrom(src => src.Users.Count))
            .ForMember(dest => dest.Members, opt => opt.MapFrom(src => src.Users))
            .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore());

        CreateMap<CreateProjectDto, Project>();
        CreateMap<UpdateProjectDto, Project>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        CreateMap<ProjectInvitation, ProjectInvitationDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project.Name))
            .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"))
            .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email ?? string.Empty))
            .ForMember(dest => dest.InvitedByFullName, opt => opt.MapFrom(src => $"{src.InvitedByUser.FirstName} {src.InvitedByUser.LastName}"));
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
            .ForMember(dest => dest.TasksCount, opt => opt.MapFrom(src => src.Tasks.Count))
            .ForMember(dest => dest.CompletedTasksCount, opt => opt.MapFrom(src =>
                src.Tasks.Count(t => t.Status == Domain.Enums.TaskStatus.Done)))
            .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore());

        CreateMap<CreateSprintDto, Sprint>();
        CreateMap<UpdateSprintDto, Sprint>();

        // ✅ BacklogItem mappings CORRIGÉ - Ajoute le mapping pour SprintName
        CreateMap<BacklogItem, BacklogItemDto>()
            .ForMember(dest => dest.SprintName, opt => opt.MapFrom(src =>
                src.Sprint != null ? src.Sprint.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src =>
                src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src =>
                src.AssignedTo != null ? $"{src.AssignedTo.FirstName} {src.AssignedTo.LastName}" : string.Empty));

        CreateMap<CreateBacklogItemDto, BacklogItem>();

        // Workspace mappings
        CreateMap<Workspace, WorkspaceDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src =>
                src.Owner != null
                    ? $"{src.Owner.FirstName} {src.Owner.LastName}"
                    : string.Empty))
            .ForMember(dest => dest.ProjectManagerId, opt => opt.MapFrom(src => src.ProjectManagerId))
            .ForMember(dest => dest.ProjectManagerName, opt => opt.MapFrom(src =>
                src.ProjectManager != null
                    ? $"{src.ProjectManager.FirstName} {src.ProjectManager.LastName}"
                    : string.Empty))
            .ForMember(dest => dest.MemberCount, opt => opt.MapFrom(src => src.Members.Count))
            .ForMember(dest => dest.ProjectCount, opt => opt.MapFrom(src => src.Projects.Count));

        CreateMap<WorkspaceInvitation, WorkspaceInvitationDto>()
            .ForMember(dest => dest.WorkspaceName, opt => opt.MapFrom(src => src.Workspace.Name));

        CreateMap<ApplicationUser, WorkspaceInviteableUserDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email ?? string.Empty));

        CreateMap<ProjectUser, ProjectMemberDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src =>
                src.User != null
                    ? $"{src.User.FirstName} {src.User.LastName}"
                    : string.Empty))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email ?? string.Empty));

        CreateMap<WorkspaceUser, WorkspaceMemberDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src =>
                src.User != null
                    ? $"{src.User.FirstName} {src.User.LastName}"
                    : string.Empty))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email ?? string.Empty));
    }
}