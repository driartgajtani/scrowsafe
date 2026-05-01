import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { TidioService } from './core/services/tidio.service';

describe('AppComponent', () => {
  let tidioService: jest.Mocked<TidioService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    tidioService = { load: jest.fn().mockResolvedValue(undefined), identifyUser: jest.fn() } as any;
    authService = { user: jest.fn().mockReturnValue(null) } as any;

    await TestBed.configureTestingModule({
      providers: [
        { provide: TidioService, useValue: tidioService },
        { provide: AuthService, useValue: authService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AppComponent, {
        set: {
          imports: [],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load tidio on init', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(tidioService.load).toHaveBeenCalled();
  });

  it('should identify user in tidio when user exists', async () => {
    const user = { _id: '1', name: 'Test', email: 'test@test.com', role: 'buyer' };
    authService.user.mockReturnValue(user as any);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(tidioService.identifyUser).toHaveBeenCalledWith(user);
  });

  it('should not identify user in tidio when user is null', async () => {
    authService.user.mockReturnValue(null);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(tidioService.identifyUser).not.toHaveBeenCalled();
  });
});
