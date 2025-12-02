import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewUpcomingAppointments } from './view-upcoming-appointments';

describe('ViewUpcomingAppointments', () => {
  let component: ViewUpcomingAppointments;
  let fixture: ComponentFixture<ViewUpcomingAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewUpcomingAppointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewUpcomingAppointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
