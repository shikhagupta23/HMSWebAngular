import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllPatients } from './view-all-patients';

describe('ViewAllPatients', () => {
  let component: ViewAllPatients;
  let fixture: ComponentFixture<ViewAllPatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewAllPatients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAllPatients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
