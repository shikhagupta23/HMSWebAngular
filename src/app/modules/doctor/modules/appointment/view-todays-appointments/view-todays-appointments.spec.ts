import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTodaysAppointments } from './view-todays-appointments';

describe('ViewTodaysAppointments', () => {
  let component: ViewTodaysAppointments;
  let fixture: ComponentFixture<ViewTodaysAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewTodaysAppointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewTodaysAppointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
