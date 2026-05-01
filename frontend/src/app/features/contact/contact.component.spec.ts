import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ContactComponent } from './contact.component';
import { AuthService } from '../../core/services/auth.service';

describe('ContactComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        {
          provide: AuthService,
          useValue: { user: jest.fn().mockReturnValue({ name: 'John', email: 'john@test.com' }) },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ContactComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have a contact form pre-filled with user data', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const comp = fixture.componentInstance;
    expect(comp.form).toBeDefined();
    expect(comp.form.get('name')?.value).toBe('John');
    expect(comp.form.get('email')?.value).toBe('john@test.com');
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const comp = fixture.componentInstance;
    comp.form.get('message')?.setValue('');
    comp.submit();
    expect(comp.sending()).toBe(false);
  });

  it('should submit and show success after timeout', fakeAsync(() => {
    const fixture = TestBed.createComponent(ContactComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ name: 'John', email: 'john@test.com', subject: 'general', message: 'Hello there my friend' });
    comp.submit();
    expect(comp.sending()).toBe(true);
    tick(1200);
    expect(comp.sending()).toBe(false);
    expect(comp.sent()).toBe(true);
  }));

  it('should handle null user in constructor', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: AuthService, useValue: { user: jest.fn().mockReturnValue(null) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ContactComponent, { set: { imports: [], schemas: [NO_ERRORS_SCHEMA] } })
      .compileComponents();

    const f = TestBed.createComponent(ContactComponent);
    expect(f.componentInstance.form.get('name')?.value).toBe('');
    expect(f.componentInstance.form.get('email')?.value).toBe('');
  });

  it('should reset the form', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const comp = fixture.componentInstance;
    comp.sent.set(true);
    comp.reset();
    expect(comp.sent()).toBe(false);
    expect(comp.form.get('message')?.value).toBe('');
  });
});
