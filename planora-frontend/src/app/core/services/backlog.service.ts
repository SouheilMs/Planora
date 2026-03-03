import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, BacklogItem, CreateBacklogItemRequest, TaskPriority } from '../models';

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/backlog`;

  getBacklogByProject(projectId: string): Observable<ApiResponse<BacklogItem[]>> {
    return this.http.get<ApiResponse<BacklogItem[]>>(`${this.apiUrl}/project/${projectId}`);
  }

  getBacklogItem(id: string): Observable<ApiResponse<BacklogItem>> {
    return this.http.get<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}`);
  }

  createBacklogItem(request: CreateBacklogItemRequest): Observable<ApiResponse<BacklogItem>> {
    return this.http.post<ApiResponse<BacklogItem>>(this.apiUrl, request);
  }

  updatePriority(id: string, priority: TaskPriority): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/priority`, priority);
  }

  moveToSprint(id: string, sprintId: string): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/move-to-sprint/${sprintId}`, {});
  }

  deleteBacklogItem(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
