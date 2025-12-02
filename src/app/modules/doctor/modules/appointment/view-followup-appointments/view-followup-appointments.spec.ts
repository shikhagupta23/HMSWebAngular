import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFollowupAppointments } from './view-followup-appointments';

describe('ViewFollowupAppointments', () => {
  let component: ViewFollowupAppointments;
  let fixture: ComponentFixture<ViewFollowupAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewFollowupAppointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewFollowupAppointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
