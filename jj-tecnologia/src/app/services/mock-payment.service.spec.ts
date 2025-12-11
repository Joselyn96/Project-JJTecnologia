import { TestBed } from '@angular/core/testing';

import { MockPaymentService } from './mock-payment.service';

describe('MockPaymentService', () => {
  let service: MockPaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockPaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
