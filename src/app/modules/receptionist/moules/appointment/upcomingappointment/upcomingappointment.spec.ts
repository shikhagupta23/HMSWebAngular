import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Upcomingappointment } from './upcomingappointment';

describe('Upcomingappointment', () => {
  let component: Upcomingappointment;
  let fixture: ComponentFixture<Upcomingappointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Upcomingappointment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Upcomingappointment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
