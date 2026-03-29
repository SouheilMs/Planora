// sprint.service.ts - Version complète et corrigée
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Sprint, CreateSprintRequest, SprintStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/sprints`;

  getSprintsByProject(projectId: string): Observable<ApiResponse<Sprint[]>> {
    return this.http.get<ApiResponse<Sprint[]>>(`${this.apiUrl}/project/${projectId}`);
  }
  // sprint.service.ts - Ajoutez cette méthode

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

  // ✅ AJOUTER CETTE MÉTHODE
  updateSprintStatus(sprintId: string, status: SprintStatus): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${sprintId}/status`, { status });
  }

  closeSprint(id: string): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${id}/close`, {});
  }

  deleteSprint(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
