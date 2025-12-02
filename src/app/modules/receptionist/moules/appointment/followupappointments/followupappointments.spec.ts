import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Followupappointments } from './followupappointments';

describe('Followupappointments', () => {
  let component: Followupappointments;
  let fixture: ComponentFixture<Followupappointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Followupappointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Followupappointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
