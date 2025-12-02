import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Addappointment } from './addappointment';

describe('Addappointment', () => {
  let component: Addappointment;
  let fixture: ComponentFixture<Addappointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Addappointment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Addappointment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
