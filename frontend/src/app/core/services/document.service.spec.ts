import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DocumentService } from './document.service';
import { environment } from '../../../environments/environment';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/documents`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DocumentService],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('upload should POST FormData with default type', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    service.upload('txn1', file).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/txn1`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { document: {} } });
  });

  it('upload should POST FormData with explicit type', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    service.upload('txn1', file, 'proof').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/txn1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, data: { document: {} } });
  });

  it('getByTransaction should GET documents', () => {
    service.getByTransaction('txn1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/txn1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { documents: [] } });
  });
});
