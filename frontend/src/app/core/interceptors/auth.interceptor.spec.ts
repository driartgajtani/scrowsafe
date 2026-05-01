import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: any;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('scrowsafe_access_token', 'test-token');

    authService = {
      get accessToken() { return localStorage.getItem('scrowsafe_access_token'); },
      get refreshToken() { return localStorage.getItem('scrowsafe_refresh_token'); },
      isRefreshing$: new BehaviorSubject(false),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigate: jest.fn(), createUrlTree: jest.fn() } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should add Authorization header for normal requests', () => {
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should send request without token when no token exists', () => {
    localStorage.removeItem('scrowsafe_access_token');
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should skip auth header for login requests', () => {
    httpClient.post('/api/auth/login', {}).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should skip auth header for register requests', () => {
    httpClient.post('/api/auth/register', {}).subscribe();
    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should skip auth header for refresh-token requests', () => {
    httpClient.post('/api/auth/refresh-token', {}).subscribe();
    const req = httpMock.expectOne('/api/auth/refresh-token');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should pass through non-401 errors', () => {
    let errorCaught: HttpErrorResponse | undefined;
    httpClient.get('/api/test').subscribe({ error: (err) => { errorCaught = err; } });
    const req = httpMock.expectOne('/api/test');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    expect(errorCaught?.status).toBe(500);
  });

  it('should pass through 401 when no refresh token exists', () => {
    localStorage.removeItem('scrowsafe_refresh_token');
    let errorCaught: HttpErrorResponse | undefined;
    httpClient.get('/api/test').subscribe({ error: (err) => { errorCaught = err; } });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(errorCaught?.status).toBe(401);
  });

  it('should refresh token on 401 and retry request', () => {
    localStorage.setItem('scrowsafe_refresh_token', 'refresh-tok');
    authService.refreshAccessToken.mockReturnValue(
      of({ success: true, data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })
    );

    let result: any;
    httpClient.get('/api/test').subscribe({ next: (res) => { result = res; } });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ data: 'ok' });
    expect(result).toEqual({ data: 'ok' });
  });

  it('should logout when refresh fails', () => {
    localStorage.setItem('scrowsafe_refresh_token', 'refresh-tok');
    authService.refreshAccessToken.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );

    let errorCaught = false;
    httpClient.get('/api/test').subscribe({ error: () => { errorCaught = true; } });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalled();
    expect(errorCaught).toBe(true);
  });

  it('should queue request while already refreshing', () => {
    localStorage.setItem('scrowsafe_refresh_token', 'refresh-tok');
    localStorage.setItem('scrowsafe_access_token', 'refreshed-token');
    authService.isRefreshing$ = new BehaviorSubject(true);

    let result: any;
    httpClient.get('/api/test').subscribe({ next: (res) => { result = res; } });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    authService.isRefreshing$.next(false);

    const retryReq = httpMock.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retryReq.flush({ data: 'queued-ok' });
    expect(result).toEqual({ data: 'queued-ok' });
  });
});
