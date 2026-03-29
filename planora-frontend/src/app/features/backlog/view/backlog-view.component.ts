// backlog-view.component.ts - Version complète avec tous les imports
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BacklogService } from '../../../core/services/backlog.service';
import { SprintService } from '../../../core/services/sprint.service';
import { AuthService } from '../../../core/services/auth.service';
import { BacklogItem, TaskPriority, TaskStatus, Sprint, SprintStatus } from '../../../core/models'; // ✅ AJOUT TaskStatus
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BacklogCreateDialogComponent } from '../create/backlog-create-dialog.component';
import { CreateSprintDialogComponent } from './create-sprint-dialog.component';

@Component({
  selector: 'app-backlog-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatTableModule,
    MatChipsModule,
    DragDropModule,
    LoadingComponent,
    CreateSprintDialogComponent
  ],
  templateUrl: './backlog-view.component.html',
  styleUrls: ['./backlog-view.component.scss']
})
export class BacklogViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private backlogService = inject(BacklogService);
  private sprintService = inject(SprintService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projectId = '';
  backlogItems: BacklogItem[] = [];
  sprints: Sprint[] = [];
  sprintItemsMap: Map<string, BacklogItem[]> = new Map();
  loading = true;
  displayedColumns: string[] = ['ticket', 'assignee', 'priority', 'complexity', 'actions'];

  readonly sprintColors = ['#6366f1', '#059669', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  readonly sprintColorsLight = ['#ede9fe', '#d1fae5', '#fef3c7', '#fee2e2', '#cffafe', '#fce7f3'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.sprintService.getSprintsByProject(this.projectId).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Afficher uniquement les sprints en PLANNING
          this.sprints = response.data.filter((s: Sprint) => s.status === SprintStatus.Planning);
          this.sprints.forEach(s => this.sprintItemsMap.set(s.id, []));
        }
        this.loadBacklogItems();
      },
      error: () => {
        console.error('Erreur chargement sprints');
        this.loadBacklogItems();
      }
    });
  }

  loadBacklogItems(): void {
    this.backlogService.getBacklogByProject(this.projectId).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.backlogItems = response.data.filter((item: BacklogItem) => !item.sprintId);
          this.sprints.forEach(sprint => {
            this.sprintItemsMap.set(sprint.id, response.data.filter((item: BacklogItem) => item.sprintId === sprint.id));
          });
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  getSprintItems(sprintId: string): BacklogItem[] {
    return this.sprintItemsMap.get(sprintId) ?? [];
  }

  getSprintListIds(): string[] {
    return this.sprints.map(s => 'sprint-' + s.id);
  }

  getAllListIds(excludeId: string): string[] {
    const ids = ['backlog-list', ...this.sprints.map(s => 'sprint-' + s.id)];
    return ids.filter(id => id !== excludeId);
  }

  getActiveSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === SprintStatus.Active);
  }

  getSprintColor(index: number): string {
    return this.sprintColors[index % this.sprintColors.length];
  }

  getSprintColorLight(index: number): string {
    return this.sprintColorsLight[index % this.sprintColorsLight.length];
  }

  createNewSprint(): void {
    const dialogRef = this.dialog.open(CreateSprintDialogComponent, {
      width: '550px',
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadData();
        this.snackBar.open('Nouveau sprint créé avec succès !', 'Fermer', { duration: 3000 });
      }
    });
  }

  startSprint(sprintId: string): void {
    this.sprintService.startSprint(sprintId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sprints = [];
          this.router.navigate(['/projects', this.projectId, 'board'], {
            queryParams: { sprintId: sprintId }
          });
          this.snackBar.open('Sprint démarré ! Bon travail !', 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open('Erreur lors du démarrage', 'Fermer', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.snackBar.open('Erreur lors du démarrage du sprint', 'Fermer', { duration: 3000 });
      }
    });
  }

  // ✅ Méthode onDrop complète et corrigée
  onDrop(event: CdkDragDrop<BacklogItem[]>, targetId: string): void {
    const item: BacklogItem = event.item.data;
    console.log('Item dropped:', item);
    console.log('Target:', targetId);

    if (event.previousContainer === event.container) {
      return;
    }

    let destinationSprintId: string | null = null;
    let isMovingToBacklog = false;

    if (targetId === 'backlog-list') {
      isMovingToBacklog = true;
    } else {
      destinationSprintId = targetId.replace('sprint-', '');
    }

    console.log('Destination sprint ID:', destinationSprintId);

    // 1. RETIRER L'ITEM DE L'ANCIEN EMPLACEMENT
    if (event.previousContainer.id === 'backlog-list') {
      const index = this.backlogItems.findIndex(i => i.id === item.id);
      if (index !== -1) {
        this.backlogItems.splice(index, 1);
      }
    } else {
      const sourceSprintId = event.previousContainer.id.replace('sprint-', '');
      const sourceList = this.sprintItemsMap.get(sourceSprintId);
      if (sourceList) {
        const index = sourceList.findIndex(i => i.id === item.id);
        if (index !== -1) {
          sourceList.splice(index, 1);
        }
      }
    }

    // 2. AJOUTER L'ITEM À LA NOUVELLE DESTINATION
    if (isMovingToBacklog) {
      item.sprintId = null;
      this.backlogItems.unshift(item);
    } else {
      // ✅ Utilisation de TaskStatus.Todo (maintenant importé)
      item.sprintId = destinationSprintId;
      item.status = TaskStatus.Todo;
      console.log('Item sprintId mis à jour:', item.sprintId);
      console.log('Item status mis à jour:', item.status);

      const destList = this.sprintItemsMap.get(destinationSprintId!);
      if (destList) {
        destList.push(item);
      }
    }

    // 3. FORCER LA MISE À JOUR DE L'AFFICHAGE
    this.backlogItems = [...this.backlogItems];
    const newMap = new Map(this.sprintItemsMap);
    this.sprintItemsMap = newMap;

    // 4. APPEL API EN ARRIÈRE-PLAN
    if (isMovingToBacklog) {
      this.backlogService.removeFromSprint(item.id).subscribe({
        next: (response: any) => {
          if (!response.success) {
            this.loadData();
            this.snackBar.open('Erreur de synchronisation', 'Fermer', { duration: 3000 });
          }
        },
        error: () => {
          this.loadData();
          this.snackBar.open('Erreur de synchronisation', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.backlogService.moveToSprint(item.id, destinationSprintId!).subscribe({
        next: (response: any) => {
          if (!response.success) {
            this.loadData();
            this.snackBar.open('Erreur de synchronisation', 'Fermer', { duration: 3000 });
          }
        },
        error: () => {
          this.loadData();
          this.snackBar.open('Erreur de synchronisation', 'Fermer', { duration: 3000 });
        }
      });
    }

    // 5. MESSAGE DE CONFIRMATION
    if (isMovingToBacklog) {
      this.snackBar.open('↩️ Retour au backlog', 'Fermer', { duration: 2000 });
    } else {
      const sprint = this.sprints.find(s => s.id === destinationSprintId);
      this.snackBar.open(`✅ Déplacé vers ${sprint?.name}`, 'Fermer', { duration: 2000 });
    }
  }

  openCreate(): void {
    const ref = this.dialog.open(BacklogCreateDialogComponent, {
      width: '550px',
      data: { projectId: this.projectId }
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result) this.loadData();
    });
  }

  editItem(item: BacklogItem): void {
    console.log('Edit item', item);
  }

  deleteItem(item: BacklogItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer',
        message: `Supprimer "${item.title}" ?`,
        confirmLabel: 'Supprimer',
        danger: true
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.backlogService.deleteBacklogItem(item.id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.backlogItems = this.backlogItems.filter(i => i.id !== item.id);
            this.snackBar.open('Élément supprimé', 'Fermer', { duration: 2000 });
          }
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    });
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels = ['Faible', 'Moyenne', 'Haute', 'Critique'];
    return labels[priority] ?? '';
  }

  getPriorityClass(priority: TaskPriority): string {
    const classes = ['priority-low', 'priority-medium', 'priority-high', 'priority-critical'];
    return classes[priority] ?? '';
  }

  getComplexityLabel(complexity: number): string {
    const labels = ['XS', 'S', 'M', 'L', 'XL'];
    return labels[complexity] ?? 'M';
  }

  getComplexityClass(complexity: number): string {
    const classes = ['complexity-xs', 'complexity-s', 'complexity-m', 'complexity-l', 'complexity-xl'];
    return classes[complexity] ?? 'complexity-m';
  }

  getSprintStatusLabel(status: number): string {
    return ['Planning', 'Actif', 'Fermé'][status] ?? '';
  }

  getSprintStatusClass(status: number): string {
    return ['status-planning', 'status-active', 'status-closed'][status] ?? '';
  }

  goToSprintBoard(): void {
    this.router.navigate(['/projects', this.projectId, 'board']);
  }
}
