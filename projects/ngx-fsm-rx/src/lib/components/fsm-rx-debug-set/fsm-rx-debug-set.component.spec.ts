import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FsmRxDebugSetComponent } from './fsm-rx-debug-set.component';

describe('FsmRxDebugSetComponent', () => {
  let component: FsmRxDebugSetComponent;
  let fixture: ComponentFixture<FsmRxDebugSetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FsmRxDebugSetComponent]
    });
    fixture = TestBed.createComponent(FsmRxDebugSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
