import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskComment, TaskStatus, TaskPriority } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatDividerModule,
    LoadingComponent
  ],
  template: `
    <div class="page-container">
      <app-loading *ngIf="loading"></app-loading>
      <div *ngIf="!loading && task">
        <div class="page-header">
          <h1>{{ task.title }}</h1>
          <button mat-button [routerLink]="['/projects', task.projectId, 'tasks']">
            <mat-icon>arrow_back</mat-icon> Back to Tasks
          </button>
        </div>
        <div class="detail-grid">
          <mat-card>
            <mat-card-header><mat-card-title>Task Details</mat-card-title></mat-card-header>
            <mat-card-content>
              <p>{{ task.description }}</p>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="chip" [ngClass]="getStatusClass(task.status)">{{ getStatusLabel(task.status) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Priority:</span>
                <span class="chip" [ngClass]="getPriorityClass(task.priority)">{{ getPriorityLabel(task.priority) }}</span>
              </div>
              <div class="info-row"><span class="label">Assigned To:</span><span>{{ task.assignedToName || 'Unassigned' }}</span></div>
              <div class="info-row"><span class="label">Sprint:</span><span>{{ task.sprintName || 'No sprint' }}</span></div>
              <div class="info-row"><span class="label">Due Date:</span><span>{{ task.dueDate ? (task.dueDate | date:'mediumDate') : '—' }}</span></div>
              <div class="info-row"><span class="label">Progress:</span><span>{{ task.progressPercentage }}%</span></div>
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>Comments</mat-card-title></mat-card-header>
            <mat-card-content>
              <app-loading *ngIf="commentsLoading"></app-loading>
              <div *ngFor="let c of comments" class="comment">
                <div class="comment-header">
                  <strong>{{ c.authorName }}</strong>
                  <span class="comment-date">{{ c.createdAt | date:'short' }}</span>
                  <button mat-icon-button color="warn" (click)="deleteComment(c)" *ngIf="canDelete(c)" style="margin-left:auto">
                    <mat-icon style="font-size:16px">close</mat-icon>
                  </button>
                </div>
                <p>{{ c.content }}</p>
                <mat-divider></mat-divider>
              </div>
              <p *ngIf="!commentsLoading && !comments.length" class="no-data">No comments yet.</p>
              <div class="add-comment">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Add comment</mat-label>
                  <textarea matInput [formControl]="commentCtrl" rows="2"></textarea>
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="addComment()" [disabled]="commentCtrl.invalid || addingComment">
                  {{ addingComment ? 'Posting...' : 'Post' }}
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { margin: 0; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .label { font-weight: 500; min-width: 90px; }
    .chip { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .status-todo { background: #e3f2fd; color: #1976d2; }
    .status-inprogress { background: #fff3e0; color: #f57c00; }
    .status-done { background: #e8f5e9; color: #388e3c; }
    .priority-low { background: #f3e5f5; color: #7b1fa2; }
    .priority-medium { background: #e3f2fd; color: #1565c0; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-critical { background: #ffebee; color: #c62828; }
    .comment { margin-bottom: 12px; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .comment-date { color: #999; font-size: 0.8rem; }
    .no-data { color: #999; font-style: italic; }
    .add-comment { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
  `]
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  commentsLoading = true;
  addingComment = false;
  task: Task | null = null;
  comments: TaskComment[] = [];
  commentCtrl = new FormControl('', Validators.required);

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id')!;
    this.taskService.getTask(taskId).subscribe({
      next: r => {
        this.loading = false;
        if (r.success) {
          this.task = r.data;
          this.loadComments(taskId);
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load task', 'Close', { duration: 3000 });
      }
    });
  }

  loadComments(taskId: string): void {
    this.commentsLoading = true;
    this.taskService.getComments(taskId).subscribe({
      next: r => {
        this.commentsLoading = false;
        if (r.success) this.comments = r.data;
      },
      error: () => { this.commentsLoading = false; }
    });
  }

  addComment(): void {
    if (!this.task || this.commentCtrl.invalid) return;
    this.addingComment = true;
    this.taskService.addComment(this.task.id, this.commentCtrl.value!).subscribe({
      next: r => {
        this.addingComment = false;
        if (r.success) {
          this.commentCtrl.reset();
          this.loadComments(this.task!.id);
        }
      },
      error: () => {
        this.addingComment = false;
        this.snackBar.open('Failed to add comment', 'Close', { duration: 3000 });
      }
    });
  }

  deleteComment(comment: TaskComment): void {
    if (!this.task) return;
    this.taskService.deleteComment(this.task.id, comment.id).subscribe({
      next: r => {
        if (r.success) this.loadComments(this.task!.id);
      },
      error: () => this.snackBar.open('Failed to delete comment', 'Close', { duration: 3000 })
    });
  }

  canDelete(comment: TaskComment): boolean {
    const user = this.authService.currentUser;
    return !!(user && (user.userId === comment.authorId || this.authService.hasRole(['Admin'])));
  }

  getStatusLabel(status: TaskStatus): string {
    return ['To Do', 'In Progress', 'Done'][status] ?? status.toString();
  }

  getStatusClass(status: TaskStatus): string {
    return ['status-todo', 'status-inprogress', 'status-done'][status] ?? '';
  }

  getPriorityLabel(priority: TaskPriority): string {
    return ['Low', 'Medium', 'High', 'Critical'][priority] ?? priority.toString();
  }

  getPriorityClass(priority: TaskPriority): string {
    return ['priority-low', 'priority-medium', 'priority-high', 'priority-critical'][priority] ?? '';
  }
}
