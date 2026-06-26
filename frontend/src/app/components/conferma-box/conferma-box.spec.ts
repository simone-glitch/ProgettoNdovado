import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfermaBox } from './conferma-box';

describe('ConfermaBox', () => {
  let component: ConfermaBox;
  let fixture: ComponentFixture<ConfermaBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfermaBox],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfermaBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
