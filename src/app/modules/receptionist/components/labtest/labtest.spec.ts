import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Labtest } from './labtest';

describe('Labtest', () => {
  let component: Labtest;
  let fixture: ComponentFixture<Labtest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Labtest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Labtest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
