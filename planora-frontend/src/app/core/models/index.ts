// src/app/core/models.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiry: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface UserData {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  expiry: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
}

export interface RefreshRequest {
  token: string;
  refreshToken: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceOwnerId: string;
  color?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectManagerId: string;
  projectManagerName: string;
  members?: ProjectMember[];
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export interface ProjectMember {
  userId: string;
  fullName: string;
  email: string;
}

export interface ProjectInviteableUser {
  userId: string;
  fullName: string;
  email: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedByUserId: string;
  invitedByUserName: string;
  status: number;
  createdAt: string;
  respondedAt?: string | null;
}

export interface CreateProjectRequest {
  workspaceId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectManagerId: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  projectManagerId: string;
  projectManagerName: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  fullName: string;
  email: string;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  invitedByUserId: string;
  expiresAt: string;
  accepted: boolean;
  createdAt: string;
}

export interface WorkspaceInviteableUser {
  userId: string;
  fullName: string;
  email: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description: string;
}

export interface SetWorkspaceProjectManagerRequest {
  userId: string;
}

export interface InviteWorkspaceUserRequest {
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercentage: number;
  dueDate: string;
  projectId: string;
  projectName: string;
  assignedToId: string;
  assignedToName: string;
  sprintId: string;
  sprintName: string;
}

export enum TaskStatus {
  Todo = 0,
  InProgress = 1,
  Done = 2
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercentage: number;
  dueDate: string;
  projectId: string;
  assignedToId: string;
  sprintId: string | null;
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  projectId: string;
  projectName: string;
  tasksCount: number;
  completedTasksCount: number;
  progressPercentage: number;
}

export enum SprintStatus {
  Planning = 0,
  Active = 1,
  Closed = 2
}

export interface CreateSprintRequest {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  projectId: string;
  status?: number;
}

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  sprintId: string | null;
  sprintName: string | null;
  status: TaskStatus;
  assignedToName: string;
  progressPercentage: number;
  dueDate: string;
  assignedToId?: string;
  complexity?: number;
  createdAt?: string;
  updatedAt?: string;
  storyPoints?: number | null;
}

export interface CreateBacklogItemRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  projectId: string;
  assignedToId?: string;
  complexity?: number;
  sprintId?: string | null;
}

export interface UpdateBacklogItemRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedToId?: string | null;
  complexity?: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  userName: string;
  roles: string[];
  isActive: boolean;
}

export interface AssignRoleRequest {
  userId: string;
  role: string;
}

export interface DashboardData {
  totalProjects: number;
  activeSprints: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  toDoTasks: number;
  overallProgressPercentage: number;
  projectsProgress: ProjectProgress[];
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  workspaceName: string;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
}
