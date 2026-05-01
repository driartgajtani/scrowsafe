import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly currentUser = signal<User | null>(null);
  private refreshing$ = new BehaviorSubject<boolean>(false);
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem('scrowsafe_user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch {
        this.clearStorage();
      }
    }
  }

  get accessToken(): string | null {
    return this.isBrowser ? localStorage.getItem('scrowsafe_access_token') : null;
  }

  get refreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem('scrowsafe_refresh_token') : null;
  }

  get isRefreshing$(): BehaviorSubject<boolean> {
    return this.refreshing$;
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => this.handleAuthSuccess(res.data)),
      catchError(this.handleError)
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => this.handleAuthSuccess(res.data)),
      catchError(this.handleError)
    );
  }

  refreshAccessToken(): Observable<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    this.refreshing$.next(true);
    return this.http
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(`${this.apiUrl}/refresh-token`, {
        refreshToken: this.refreshToken,
      })
      .pipe(
        tap((res) => {
          if (this.isBrowser) {
            localStorage.setItem('scrowsafe_access_token', res.data.accessToken);
            localStorage.setItem('scrowsafe_refresh_token', res.data.refreshToken);
          }
          this.refreshing$.next(false);
        }),
        catchError((err) => {
          this.refreshing$.next(false);
          this.logout();
          return throwError(() => err);
        })
      );
  }

  getProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        this.currentUser.set(res.data.user);
        if (this.isBrowser) localStorage.setItem('scrowsafe_user', JSON.stringify(res.data.user));
      })
    );
  }

  logout(): void {
    const token = this.accessToken;
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    }
    this.clearStorage();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(data: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('scrowsafe_access_token', data.accessToken);
      localStorage.setItem('scrowsafe_refresh_token', data.refreshToken);
      localStorage.setItem('scrowsafe_user', JSON.stringify(data.user));
    }
    this.currentUser.set(data.user);
  }

  private clearStorage(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('scrowsafe_access_token');
    localStorage.removeItem('scrowsafe_refresh_token');
    localStorage.removeItem('scrowsafe_user');
  }

  updateProfile(data: { name?: string; email?: string }): Observable<ApiResponse<{ user: User }>> {
    return this.http.put<ApiResponse<{ user: User }>>(`${this.apiUrl}/profile`, data).pipe(
      tap((res) => {
        this.currentUser.set(res.data.user);
        if (this.isBrowser) localStorage.setItem('scrowsafe_user', JSON.stringify(res.data.user));
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/change-password`, data);
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/reset-password`, { token, password });
  }

  verifyEmail(token: string): Observable<ApiResponse<null>> {
    return this.http.get<ApiResponse<null>>(`${this.apiUrl}/verify/${token}`);
  }

  resendVerification(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/resend-verification`, { email });
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
