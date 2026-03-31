// src/app/core/services/sprint.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Sprint, CreateSprintRequest, SprintStatus, BacklogItem } from '../models';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/sprints`;
  private backlogApiUrl = `${environment.apiUrl}/api/backlog`;

  getSprintsByProject(projectId: string): Observable<ApiResponse<Sprint[]>> {
    return this.http.get<ApiResponse<Sprint[]>>(`${this.apiUrl}/project/${projectId}`);
  }

  startSprint(sprintId: string): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${sprintId}/start`, {});
  }

  getSprint(id: string): Observable<ApiResponse<Sprint>> {
    return this.http.get<ApiResponse<Sprint>>(`${this.apiUrl}/${id}`);
  }

  createSprint(request: CreateSprintRequest): Observable<ApiResponse<Sprint>> {
    return this.http.post<ApiResponse<Sprint>>(this.apiUrl, request);
  }

  updateSprint(id: string, request: Partial<CreateSprintRequest>): Observable<ApiResponse<Sprint>> {
    return this.http.put<ApiResponse<Sprint>>(`${this.apiUrl}/${id}`, request);
  }

  updateSprintStatus(sprintId: string, status: SprintStatus): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${sprintId}/status`, { status });
  }

  closeSprint(id: string): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${id}/close`, {});
  }

  deleteSprint(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  getCompletedSprints(projectId: string): Observable<ApiResponse<Sprint[]>> {
    return this.http.get<ApiResponse<Sprint[]>>(`${this.apiUrl}/project/${projectId}/completed`);
  }

  getSprintTasks(sprintId: string): Observable<ApiResponse<BacklogItem[]>> {
    return this.http.get<ApiResponse<BacklogItem[]>>(`${this.backlogApiUrl}/sprint/${sprintId}`);
  }
}
