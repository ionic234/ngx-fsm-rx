import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FsmRxStateDiagramComponent } from './fsm-rx-state-diagram.component';

describe('FsmRxStateDiagramComponent', () => {
  let component: FsmRxStateDiagramComponent;
  let fixture: ComponentFixture<FsmRxStateDiagramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FsmRxStateDiagramComponent]
    });
    fixture = TestBed.createComponent(FsmRxStateDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
