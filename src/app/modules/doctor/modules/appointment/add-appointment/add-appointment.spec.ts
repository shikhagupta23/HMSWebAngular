import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAppointment } from './add-appointment';

describe('AddAppointment', () => {
  let component: AddAppointment;
  let fixture: ComponentFixture<AddAppointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddAppointment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAppointment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
