import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Todayappointments } from './todayappointments';

describe('Todayappointments', () => {
  let component: Todayappointments;
  let fixture: ComponentFixture<Todayappointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Todayappointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Todayappointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
