import { TestBed } from '@angular/core/testing';

import { AsidebarService } from './asidebar-service';

describe('AsidebarService', () => {
  let service: AsidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
