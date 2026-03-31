// src/app/core/services/backlog.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, BacklogItem, CreateBacklogItemRequest, TaskPriority, TaskStatus, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/backlog`;

  getBacklogByProject(projectId: string): Observable<ApiResponse<BacklogItem[]>> {
    return this.http.get<ApiResponse<BacklogItem[]>>(`${this.apiUrl}/project/${projectId}`);
  }

  // ✅ AJOUTER CETTE MÉTHODE
  getAllBacklogItemsForProject(projectId: string, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<BacklogItem>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PagedResult<BacklogItem>>>(`${this.apiUrl}/project/${projectId}/all-items`, { params });
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

  updateBacklogItemStatus(id: string, status: TaskStatus): Observable<ApiResponse<BacklogItem>> {
    console.log('Appel API updateStatus:', id, status);
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/status`, { status });
  }

  moveToSprint(id: string, sprintId: string): Observable<ApiResponse<BacklogItem>> {
    console.log('Moving item', id, 'to sprint', sprintId);
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/move-to-sprint/${sprintId}`, {});
  }

  removeFromSprint(id: string): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/remove-from-sprint`, {});
  }

  deleteBacklogItem(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  getSprintTasks(sprintId: string): Observable<ApiResponse<BacklogItem[]>> {
    return this.http.get<ApiResponse<BacklogItem[]>>(`${this.apiUrl}/sprint/${sprintId}`);
  }

  assignToUser(id: string, userId: string | null): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/assign`, { assignedToId: userId });
  }

  updateComplexity(id: string, complexity: number): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/complexity`, complexity);
  }
}
