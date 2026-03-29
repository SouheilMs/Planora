import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, BacklogItem, CreateBacklogItemRequest, TaskPriority, TaskStatus } from '../models';

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

  // AJOUTER CETTE MÉTHODE - Mettre à jour le statut
  updateBacklogItemStatus(id: string, status: TaskStatus): Observable<ApiResponse<BacklogItem>> {
    console.log('Appel API updateStatus:', id, status);
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Déplacer vers un sprint
  // backlog.service.ts
  moveToSprint(id: string, sprintId: string): Observable<ApiResponse<BacklogItem>> {
    console.log('Moving item', id, 'to sprint', sprintId);
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/move-to-sprint/${sprintId}`, {});
  }

  // Retirer du sprint
  removeFromSprint(id: string): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/remove-from-sprint`, {});
  }

  deleteBacklogItem(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
