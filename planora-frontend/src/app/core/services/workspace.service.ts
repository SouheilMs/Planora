import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateWorkspaceRequest,
  InviteWorkspaceUserRequest,
  WorkspaceInviteableUser,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember
} from '../models';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/workspaces`;

  workspaceListChanged$ = new Subject<void>();

  getWorkspaces(): Observable<ApiResponse<Workspace[]>> {
    return this.http.get<ApiResponse<Workspace[]>>(this.apiUrl);
  }

  getWorkspace(id: string): Observable<ApiResponse<Workspace>> {
    return this.http.get<ApiResponse<Workspace>>(`${this.apiUrl}/${id}`);
  }

  createWorkspace(request: CreateWorkspaceRequest): Observable<ApiResponse<Workspace>> {
    return this.http.post<ApiResponse<Workspace>>(this.apiUrl, request);
  }

  getMembers(workspaceId: string): Observable<ApiResponse<WorkspaceMember[]>> {
    return this.http.get<ApiResponse<WorkspaceMember[]>>(`${this.apiUrl}/${workspaceId}/members`);
  }

  getInviteableUsers(workspaceId: string): Observable<ApiResponse<WorkspaceInviteableUser[]>> {
    return this.http.get<ApiResponse<WorkspaceInviteableUser[]>>(`${this.apiUrl}/${workspaceId}/inviteable-users`);
  }

  inviteUser(workspaceId: string, request: InviteWorkspaceUserRequest): Observable<ApiResponse<WorkspaceInvitation>> {
    return this.http.post<ApiResponse<WorkspaceInvitation>>(`${this.apiUrl}/${workspaceId}/invitations`, request);
  }

  getPendingInvitations(): Observable<ApiResponse<WorkspaceInvitation[]>> {
    return this.http.get<ApiResponse<WorkspaceInvitation[]>>(`${this.apiUrl}/invitations/pending`);
  }

  acceptInvitation(invitationId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/invitations/${invitationId}/accept`, {});
  }

  rejectInvitation(invitationId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/invitations/${invitationId}/reject`, {});
  }

  removeMember(workspaceId: string, userId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${workspaceId}/members/${userId}`);
  }

  setProjectManager(workspaceId: string, userId: string): Observable<ApiResponse<Workspace>> {
    return this.http.put<ApiResponse<Workspace>>(`${this.apiUrl}/${workspaceId}/project-manager`, { userId });
  }

  deleteWorkspace(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
