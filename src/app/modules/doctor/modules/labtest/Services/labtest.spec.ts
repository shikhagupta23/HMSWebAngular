import { TestBed } from '@angular/core/testing';

import { Labtest } from './labtest';

describe('Labtest', () => {
  let service: Labtest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Labtest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
