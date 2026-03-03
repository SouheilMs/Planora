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
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectManagerId: string;
  projectManagerName: string;
  members: ProjectMember[];
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export interface ProjectMember {
  userId: string;
  fullName: string;
  email: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  projectManagerId: string;
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
}

export interface CreateBacklogItemRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  projectId: string;
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
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
}
