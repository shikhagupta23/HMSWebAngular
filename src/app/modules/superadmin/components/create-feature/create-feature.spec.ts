import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFeature } from './create-feature';

describe('CreateFeature', () => {
  let component: CreateFeature;
  let fixture: ComponentFixture<CreateFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateFeature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
