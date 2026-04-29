import {
  Component, Input, OnInit, OnDestroy, inject,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { ChatInboxService } from '../../../../core/services/chat-inbox.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatSession, ChatMessage } from '../../../../core/models';
import { environment } from '../../../../../environments/environment';

interface ToastNotif {
  id: string;
  senderName: string;
  content: string;
  sessionTitle: string;
  sessionId: string;
  visible: boolean;
}

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() projectId!: string;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private chatService = inject(ChatInboxService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private hubConnection!: signalR.HubConnection;

  isOpen = false;
  sessions: ChatSession[] = [];
  messages: ChatMessage[] = [];
  selectedSession: ChatSession | null = null;
  creatingSession = false;
  sendingMessage = false;
  showNewSessionForm = false;
  isAiTyping = false;
  private shouldScrollToBottom = false;

  // ── Unread & notifications ──
  unreadCount = 0;
  toasts: ToastNotif[] = [];

  messageForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1)]]
  });

  sessionForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  get currentUserId(): string | undefined {
    return this.authService.currentUser?.userId;
  }

  ngOnInit(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/chat`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('📨 SignalR reçu:', message);

      const isDuplicate = this.messages.find(m => m.id === message.id);
      if (isDuplicate) return;

      if (message.isAssistant) this.isAiTyping = false;

      const isFromOther = message.senderUserId !== this.currentUserId;
      const isCurrentSession = this.selectedSession?.id === (message.chatSessionId?.toString());

      if (isFromOther || message.isAssistant) {
        if (!this.isOpen || !isCurrentSession) {
          this.unreadCount++;
          this.showToast(message);
        }
      }

      // N'ajouter dans messages[] que si c'est la session active
      if (isCurrentSession) {
        this.messages.push(message);
        this.shouldScrollToBottom = true;
      }
    });

    this.hubConnection.start()
      .then(() => console.log('✅ SignalR connecté'))
      .catch(err => console.error('❌ SignalR erreur:', err));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.hubConnection?.stop();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // ── TOAST NOTIFICATION ──
  showToast(message: ChatMessage): void {
    const session = this.sessions.find(s => s.id === message.chatSessionId?.toString());
    const toast: ToastNotif = {
      id: message.id.toString(),
      senderName: message.isAssistant ? '🤖 Planora AI' : (message.senderName || 'Membre'),
      content: message.content.length > 60 ? message.content.slice(0, 60) + '…' : message.content,
      sessionTitle: session?.title || 'Conversation',
      sessionId: message.chatSessionId?.toString() || '',
      visible: true
    };
    this.toasts.push(toast);
    setTimeout(() => this.dismissToast(toast.id), 5000);
  }

  dismissToast(id: string): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 300);
    }
  }

  openFromToast(toast: ToastNotif): void {
    this.dismissToast(toast.id);
    this.isOpen = true;
    this.unreadCount = 0;
    const session = this.sessions.find(s => s.id === toast.sessionId);
    if (session) this.selectSession(session);
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      if (this.sessions.length === 0) {
        if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
          this.loadSessions();
        } else {
          this.hubConnection.start()
            .then(() => this.loadSessions())
            .catch(err => console.error(err));
        }
      }
    }
  }

  loadSessions(): void {
    this.chatService.getSessions(this.projectId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          this.sessions = res.success ? res.data : [];
          if (!this.selectedSession && this.sessions.length > 0) {
            this.selectSession(this.sessions[0]);
          }
        }
      });
  }

  selectSession(session: ChatSession): void {
    if (this.selectedSession && this.selectedSession.id !== session.id) {
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.hubConnection.invoke('LeaveSession', this.selectedSession.id)
          .catch(err => console.error('LeaveSession error:', err));
      }
    }

    this.selectedSession = session;
    this.showNewSessionForm = false;
    this.isAiTyping = false;
    this.messages = [];

    const joinSession = () => {
      this.hubConnection.invoke('JoinSession', session.id)
        .then(() => console.log(`✅ Joined session: ${session.id}`))
        .catch(err => console.error('JoinSession error:', err));
    };

    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      joinSession();
    } else {
      this.hubConnection.start()
        .then(() => joinSession())
        .catch(err => console.error('SignalR start error:', err));
    }

    this.chatService.getMessages(this.projectId, session.id)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          this.messages = res.success ? res.data : [];
          this.shouldScrollToBottom = true;
        }
      });
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.selectedSession || this.sendingMessage) return;

    const content = this.messageForm.value.content!.trim();
    this.sendingMessage = true;
    const isAiCommand = content.toLowerCase().startsWith('@chat');

    this.chatService.sendMessage(this.projectId, this.selectedSession.id, { content })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          this.sendingMessage = false;
          if (res.success && res.data) {
            this.messageForm.reset();
            if (!this.messages.find(m => m.id === res.data.id)) {
              this.messages.push(res.data);
              this.shouldScrollToBottom = true;
            }
            if (isAiCommand) {
              this.isAiTyping = true;
              this.shouldScrollToBottom = true;
            }
          }
        },
        error: () => {
          this.sendingMessage = false;
          this.isAiTyping = false;
        }
      });
  }

  createSession(): void {
    if (this.sessionForm.invalid || this.creatingSession) return;
    this.creatingSession = true;
    const title = this.sessionForm.value.title!.trim();

    this.chatService.createSession(this.projectId, { title })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          this.creatingSession = false;
          if (res.success && res.data) {
            this.sessions = [res.data, ...this.sessions];
            this.sessionForm.reset();
            this.showNewSessionForm = false;
            this.selectSession(res.data);
          }
        },
        error: () => { this.creatingSession = false; }
      });
  }

  deleteSession(session: ChatSession, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Supprimer la conversation "${session.title}" ?`)) return;

    this.chatService.deleteSession(this.projectId, session.id)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.sessions = this.sessions.filter(s => s.id !== session.id);
          if (this.selectedSession?.id === session.id) {
            this.messages = [];
            this.selectedSession = this.sessions[0] ?? null;
            if (this.selectedSession) this.selectSession(this.selectedSession);
          }
        },
        error: () => console.error('Erreur suppression session')
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isMine(message: ChatMessage): boolean {
    return message.senderUserId === this.currentUserId;
  }

  isChatCommand(message: ChatMessage): boolean {
    return message.content.trimStart().toLowerCase().startsWith('@chat');
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { }
  }
}
