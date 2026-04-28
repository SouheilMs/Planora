import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ChatMessage, ChatSession, CreateChatSessionRequest, SendChatMessageRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ChatInboxService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/projects`;

  getSessions(projectId: string): Observable<ApiResponse<ChatSession[]>> {
    return this.http.get<ApiResponse<ChatSession[]>>(`${this.baseUrl}/${projectId}/chat/sessions`);
  }

  createSession(projectId: string, request: CreateChatSessionRequest): Observable<ApiResponse<ChatSession>> {
    return this.http.post<ApiResponse<ChatSession>>(`${this.baseUrl}/${projectId}/chat/sessions`, request);
  }

  getMessages(projectId: string, sessionId: string): Observable<ApiResponse<ChatMessage[]>> {
    return this.http.get<ApiResponse<ChatMessage[]>>(`${this.baseUrl}/${projectId}/chat/sessions/${sessionId}/messages`);
  }

  sendMessage(projectId: string, sessionId: string, request: SendChatMessageRequest): Observable<ApiResponse<ChatMessage>> {
    return this.http.post<ApiResponse<ChatMessage>>(`${this.baseUrl}/${projectId}/chat/sessions/${sessionId}/messages`, request);
  }
}