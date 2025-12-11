import { TestBed } from '@angular/core/testing';

import { CulquiService } from './culqui.service';

describe('CulquiService', () => {
  let service: CulquiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CulquiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
