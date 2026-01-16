import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationPrompt } from './notification-prompt';

describe('NotificationPrompt', () => {
  let component: NotificationPrompt;
  let fixture: ComponentFixture<NotificationPrompt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationPrompt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPrompt);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
