import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateProjectRequest,
  PagedResult,
  Project,
  ProjectInvitation,
  ProjectInviteableUser
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/projects`;

  getProjects(page = 1, pageSize = 10, search = ''): Observable<ApiResponse<PagedResult<Project>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize).set('search', search);
    return this.http.get<ApiResponse<PagedResult<Project>>>(this.apiUrl, { params });
  }

  getProject(id: string): Observable<ApiResponse<Project>> {
    if (!id || id === 'null' || id === 'undefined') {
      return throwError(() => new Error('Invalid project id'));
    }

    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  createProject(request: CreateProjectRequest): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, request);
  }

  updateProject(id: string, request: Partial<CreateProjectRequest>): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, request);
  }

  deleteProject(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  addMember(projectId: string, userId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${projectId}/members/${userId}`, {});
  }

  removeMember(projectId: string, userId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${projectId}/members/${userId}`);
  }

  getInviteableMembers(projectId: string): Observable<ApiResponse<ProjectInviteableUser[]>> {
    return this.http.get<ApiResponse<ProjectInviteableUser[]>>(`${this.apiUrl}/${projectId}/inviteable-members`);
  }

  inviteMember(projectId: string, userId: string): Observable<ApiResponse<ProjectInvitation>> {
    return this.http.post<ApiResponse<ProjectInvitation>>(`${this.apiUrl}/${projectId}/invitations`, { userId });
  }

  getPendingInvitations(): Observable<ApiResponse<ProjectInvitation[]>> {
    return this.http.get<ApiResponse<ProjectInvitation[]>>(`${this.apiUrl}/invitations/pending`);
  }

  acceptInvitation(invitationId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/invitations/${invitationId}/accept`, {});
  }

  rejectInvitation(invitationId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/invitations/${invitationId}/reject`, {});
  }
}
