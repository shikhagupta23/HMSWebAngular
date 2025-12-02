import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asidebar } from './asidebar';

describe('Asidebar', () => {
  let component: Asidebar;
  let fixture: ComponentFixture<Asidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Asidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
