// src/app/core/services/backlog.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, BacklogItem, CreateBacklogItemRequest, UpdateBacklogItemRequest, TaskPriority, TaskStatus, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/backlog`;
  private readonly guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private isGuid(value: string | null | undefined): value is string {
    return !!value && this.guidPattern.test(value);
  }

  getBacklogByProject(projectId: string): Observable<ApiResponse<BacklogItem[]>> {
    return this.http.get<ApiResponse<BacklogItem[]>>(`${this.apiUrl}/project/${projectId}`);
  }

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

  updateBacklogItem(id: string, request: UpdateBacklogItemRequest): Observable<ApiResponse<BacklogItem>> {
    return this.http.put<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}`, request);
  }

  updatePriority(id: string, priority: TaskPriority): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/priority`, priority);
  }

  updateBacklogItemStatus(id: string, status: TaskStatus): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/status`, { status });
  }

  moveToSprint(id: string, sprintId: string): Observable<ApiResponse<BacklogItem>> {
    if (!this.isGuid(id) || !this.isGuid(sprintId)) {
      return throwError(() => new Error('Invalid backlog item id or sprint id for move-to-sprint request.'));
    }

    const url = `${this.apiUrl}/${id}/move-to-sprint/${sprintId}`;
    return this.http.patch<ApiResponse<BacklogItem>>(url, {}).pipe(
      catchError((err: HttpErrorResponse) => {
        // Some environments expose this route as POST; fallback for compatibility.
        if (err.status === 405 || err.status === 404) {
          return this.http.post<ApiResponse<BacklogItem>>(url, {});
        }
        return throwError(() => err);
      })
    );
  }

  removeFromSprint(id: string): Observable<ApiResponse<BacklogItem>> {
    if (!this.isGuid(id)) {
      return throwError(() => new Error('Invalid backlog item id for remove-from-sprint request.'));
    }

    const url = `${this.apiUrl}/${id}/remove-from-sprint`;
    return this.http.patch<ApiResponse<BacklogItem>>(url, {}).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 405 || err.status === 404) {
          return this.http.post<ApiResponse<BacklogItem>>(url, {});
        }
        return throwError(() => err);
      })
    );
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

  updateAssignment(id: string, userId: string | null): Observable<ApiResponse<BacklogItem>> {
    return this.assignToUser(id, userId);
  }

  updateComplexity(id: string, complexity: number): Observable<ApiResponse<BacklogItem>> {
    return this.http.patch<ApiResponse<BacklogItem>>(`${this.apiUrl}/${id}/complexity`, complexity);
  }
}
