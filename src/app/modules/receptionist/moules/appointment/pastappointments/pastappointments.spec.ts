import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pastappointments } from './pastappointments';

describe('Pastappointments', () => {
  let component: Pastappointments;
  let fixture: ComponentFixture<Pastappointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pastappointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pastappointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
