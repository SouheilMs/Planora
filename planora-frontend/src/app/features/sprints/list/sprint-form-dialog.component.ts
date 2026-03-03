import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SprintService } from '../../../core/services/sprint.service';
import { Sprint } from '../../../core/models';

@Component({
  selector: 'app-sprint-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.sprint ? 'Edit' : 'Create' }} Sprint</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Goal</mat-label>
          <textarea matInput formControlName="goal" rows="3"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 8px); }
    .row { display: flex; gap: 16px; }
  `]
})
export class SprintFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sprintService = inject(SprintService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<SprintFormDialogComponent>);

  saving = false;

  form = this.fb.group({
    name: ['', Validators.required],
    goal: [''],
    startDate: [null as Date | null],
    endDate: [null as Date | null]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { sprint: Sprint | null; projectId: string }) {}

  ngOnInit(): void {
    if (this.data.sprint) {
      const s = this.data.sprint;
      this.form.patchValue({
        name: s.name,
        goal: s.goal,
        startDate: s.startDate ? new Date(s.startDate) : null,
        endDate: s.endDate ? new Date(s.endDate) : null
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;
    const payload = {
      name: value.name!,
      goal: value.goal || '',
      startDate: value.startDate ? (value.startDate as Date).toISOString() : '',
      endDate: value.endDate ? (value.endDate as Date).toISOString() : '',
      projectId: this.data.projectId
    };
    const obs = this.data.sprint
      ? this.sprintService.updateSprint(this.data.sprint.id, payload)
      : this.sprintService.createSprint(payload);
    obs.subscribe({
      next: response => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open(`Sprint ${this.data.sprint ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response.message, 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.saving = false;
        this.snackBar.open(err?.error?.message || 'Save failed', 'Close', { duration: 4000 });
      }
    });
  }
}
