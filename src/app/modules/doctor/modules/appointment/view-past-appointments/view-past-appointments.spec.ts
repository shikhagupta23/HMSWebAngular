import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPastAppointments } from './view-past-appointments';

describe('ViewPastAppointments', () => {
  let component: ViewPastAppointments;
  let fixture: ComponentFixture<ViewPastAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewPastAppointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPastAppointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
