import { TestBed } from '@angular/core/testing';

import { MedicineSevice } from './medicine-sevice';

describe('MedicineSevice', () => {
  let service: MedicineSevice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicineSevice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
