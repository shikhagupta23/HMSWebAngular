import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllAppointments } from './view-all-appointments';

describe('ViewAllAppointments', () => {
  let component: ViewAllAppointments;
  let fixture: ComponentFixture<ViewAllAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewAllAppointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAllAppointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
