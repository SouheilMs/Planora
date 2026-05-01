import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ChatInboxService } from '../../../core/services/chat-inbox.service';
import { ProjectService } from '../../../core/services/project.service';
import { ChatMessage, ChatSession, Project } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-project-inbox',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './project-inbox.component.html',
  styleUrls: ['./project-inbox.component.css']
})
export class ProjectInboxComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private chatService = inject(ChatInboxService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  loading = true;
  project: Project | null = null;
  sessions: ChatSession[] = [];
  messages: ChatMessage[] = [];
  selectedSession: ChatSession | null = null;
  creatingSession = false;
  sendingMessage = false;

  sessionForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]]
  });

  messageForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(4000)]]
  });

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (!projectId || projectId === 'null' || projectId === 'undefined') {
      this.loading = false;
      this.snackBar.open('Invalid project id in URL', 'Close', { duration: 3000 });
      return;
    }

    this.loadProjectAndSessions(projectId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canOpenInbox(): boolean {
    const currentUserId = this.authService.currentUser?.userId;
    if (!this.project || !currentUserId) return false;
    return (this.project.members || []).some(member => member.userId === currentUserId) ||
      currentUserId === this.project.projectManagerId;
  }

  get currentUserId(): string | null {
    return this.authService.currentUser?.userId ?? null;
  }

  private loadProjectAndSessions(projectId: string): void {
    this.loading = true;
    this.projectService.getProject(projectId).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.loading = false;
          this.snackBar.open('Project not found', 'Close', { duration: 3000 });
          return;
        }

        this.project = response.data;
        if (!this.canOpenInbox) {
          this.loading = false;
          this.snackBar.open('You do not have access to this inbox', 'Close', { duration: 4000 });
          this.router.navigate(['/projects', projectId]);
          return;
        }

        this.loadSessions(projectId);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
      }
    });
  }

  loadSessions(projectId: string): void {
    this.chatService.getSessions(projectId).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        this.loading = false;
        this.sessions = response.success && response.data ? response.data : [];
        if (this.selectedSession) {
          this.selectedSession = this.sessions.find(session => session.id === this.selectedSession?.id) || this.sessions[0] || null;
        } else {
          this.selectedSession = this.sessions[0] || null;
        }

        if (this.selectedSession) {
          this.loadMessages(projectId, this.selectedSession.id);
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load inbox sessions', 'Close', { duration: 3000 });
      }
    });
  }

  loadMessages(projectId: string, sessionId: string): void {
    this.chatService.getMessages(projectId, sessionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        this.messages = response.success && response.data ? response.data : [];
      },
      error: () => {
        this.snackBar.open('Failed to load messages', 'Close', { duration: 3000 });
      }
    });
  }

  selectSession(session: ChatSession): void {
    if (!this.project) return;
    this.selectedSession = session;
    this.loadMessages(this.project.id, session.id);
  }

  createSession(): void {
    if (!this.project || this.sessionForm.invalid) {
      this.snackBar.open('Please provide a session title', 'Close', { duration: 3000 });
      return;
    }

    this.creatingSession = true;
    const title = this.sessionForm.value.title?.trim() ?? '';

    this.chatService.createSession(this.project.id, { title }).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        this.creatingSession = false;
        if (response.success && response.data) {
          this.sessionForm.reset();
          this.sessions = [response.data, ...this.sessions];
          this.selectSession(response.data);
          this.snackBar.open('Conversation created', 'Close', { duration: 2500 });
        }
      },
      error: err => {
        this.creatingSession = false;
        this.snackBar.open(err?.error?.message || 'Failed to create conversation', 'Close', { duration: 4000 });
      }
    });
  }

  sendMessage(): void {
    if (!this.project || !this.selectedSession || this.messageForm.invalid) {
      this.snackBar.open('Type a message before sending', 'Close', { duration: 3000 });
      return;
    }

    const projectId = this.project.id;
    const sessionId = this.selectedSession.id;

    this.sendingMessage = true;
    const content = this.messageForm.value.content?.trim() ?? '';

    this.chatService.sendMessage(projectId, sessionId, { content }).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        this.sendingMessage = false;
        if (response.success && response.data) {
          this.messageForm.reset();
          this.loadSessions(projectId);
        }
      },
      error: err => {
        this.sendingMessage = false;
        this.snackBar.open(err?.error?.message || 'Failed to send message', 'Close', { duration: 4000 });
      }
    });
  }

  trackBySessionId(_: number, session: ChatSession): string {
    return session.id;
  }

  trackByMessageId(_: number, message: ChatMessage): string {
    return message.id;
  }

  isChatCommand(message: ChatMessage): boolean {
    return message.content.trimStart().toLowerCase().startsWith('@chat');
  }

  chatCommandBody(message: ChatMessage): string {
    const trimmed = message.content.trimStart();
    const body = trimmed.length > 5 ? trimmed.slice(5).trimStart() : '';
    return body.length > 0 ? body : 'Requesting AI review';
  }
}