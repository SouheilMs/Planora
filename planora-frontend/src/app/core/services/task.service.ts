// src/app/core/services/task.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult, Task, CreateTaskRequest, TaskComment } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/tasks`;

  getTasksByProject(projectId: string, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Task>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<Task>>>(`${this.apiUrl}/project/${projectId}`, { params });
  }
 

  getTasksByProjectIncludingClosedSprints(projectId: string, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Task>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<Task>>>(`${this.apiUrl}/project/${projectId}/all-tasks`, { params });
  }
  getAllTasks(page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Task>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<Task>>>(`${this.apiUrl}/all`, { params });
  }

  getTask(id: string): Observable<ApiResponse<Task>> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${id}`);
  }

  createTask(request: CreateTaskRequest): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, request);
  }

  updateTask(id: string, request: Partial<CreateTaskRequest>): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, request);
  }

  deleteTask(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  getComments(taskId: string): Observable<ApiResponse<TaskComment[]>> {
    return this.http.get<ApiResponse<TaskComment[]>>(`${this.apiUrl}/${taskId}/comments`);
  }

  addComment(taskId: string, content: string): Observable<ApiResponse<TaskComment>> {
    return this.http.post<ApiResponse<TaskComment>>(`${this.apiUrl}/${taskId}/comments`, { content, taskId });
  }

  deleteComment(taskId: string, commentId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/comments/${commentId}`);
  }
}
