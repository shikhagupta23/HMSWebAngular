import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLabtest } from './add-labtest';

describe('AddLabtest', () => {
  let component: AddLabtest;
  let fixture: ComponentFixture<AddLabtest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddLabtest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLabtest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
