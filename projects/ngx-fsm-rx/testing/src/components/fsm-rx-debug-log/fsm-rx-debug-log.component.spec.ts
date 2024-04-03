import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FsmRxDebugLogComponent } from './fsm-rx-debug-log.component';

describe('FsmRxDebugSetComponent', () => {
  let component: FsmRxDebugLogComponent;
  let fixture: ComponentFixture<FsmRxDebugLogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FsmRxDebugLogComponent]
    });
    fixture = TestBed.createComponent(FsmRxDebugLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
