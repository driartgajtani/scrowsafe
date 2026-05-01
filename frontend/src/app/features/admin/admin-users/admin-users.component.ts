import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';
import { PaginationMeta } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <button mat-icon-button routerLink="/admin">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>User Management</h1>
      </div>

      <mat-card class="filter-card">
        <mat-form-field appearance="outline">
          <mat-label>Filter by Role</mat-label>
          <mat-select [(ngModel)]="filterRole" (selectionChange)="loadUsers()">
            <mat-option value="">All Roles</mat-option>
            <mat-option value="buyer">Buyer</mat-option>
            <mat-option value="seller">Seller</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-card>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="users()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-cell">
                  <mat-icon class="user-avatar">account_circle</mat-icon>
                  <div>
                    <strong>{{ user.name }}</strong>
                    <small>{{ user.email }}</small>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let user">
                <span class="role-badge role-{{ user.role }}">{{ user.role | uppercase }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="verified">
              <th mat-header-cell *matHeaderCellDef>Verified</th>
              <td mat-cell *matCellDef="let user">
                <mat-icon [class.verified]="user.verified" [class.unverified]="!user.verified">
                  {{ user.verified ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="lastLogin">
              <th mat-header-cell *matHeaderCellDef>Last Login</th>
              <td mat-cell *matCellDef="let user">
                {{ user.lastLogin ? (user.lastLogin | date:'mediumDate') : 'Never' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Joined</th>
              <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'mediumDate' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 10"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 960px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 24px; font-weight: 700; }
    }
    .filter-card { margin-bottom: 16px; padding: 16px 16px 0; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .full-width { width: 100%; }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      small { display: block; color: rgba(0,0,0,0.54); font-size: 12px; }
    }
    .user-avatar { font-size: 32px; width: 32px; height: 32px; color: #6c63ff; }
    .role-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      &.role-admin { background: #fce4ec; color: #c62828; }
      &.role-buyer { background: #e3f2fd; color: #1565c0; }
      &.role-seller { background: #e8f5e9; color: #2e7d32; }
    }
    .verified { color: #2e7d32; }
    .unverified { color: #bdbdbd; }

    @media (max-width: 768px) {
      :host ::ng-deep mat-card { overflow-x: auto; }
      :host ::ng-deep table.mat-mdc-table { min-width: 600px; }
    }
  `],
})
export class AdminUsersComponent implements OnInit {
  loading = signal(true);
  users = signal<User[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  filterRole = '';
  displayedColumns = ['name', 'role', 'verified', 'lastLogin', 'createdAt'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 1, limit = 10): void {
    this.loading.set(true);
    this.adminService.getUsers(page, limit, this.filterRole || undefined).subscribe({
      next: (res) => {
        this.users.set(res.data.users);
        this.pagination.set(res.data.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex + 1, event.pageSize);
  }
}
