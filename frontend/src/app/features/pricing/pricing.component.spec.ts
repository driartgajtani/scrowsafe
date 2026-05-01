import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { PricingComponent } from './pricing.component';
import { AuthService } from '../../core/services/auth.service';

describe('PricingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: jest.fn().mockReturnValue(null),
          },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(PricingComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should calculate example fee', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    const component = fixture.componentInstance;
    const result = component.getExampleFee({ platform: 'Instagram', icon: 'photo_camera', feePercent: 5, minFee: 25 });
    expect(result).toBe('50');
  });
});
