import { Component, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BaseStateData, CanLeaveToStatesMap, StateMap } from 'fsm-rx';
import { FsmRxComponent } from '../../classes/fsm-rx-component/fsm-rx-component';
import { FsmRxDebugSetComponent } from './fsm-rx-debug-set.component';
import { FsmRxStateDiagramComponent } from '../fsm-rx-state-diagram/fsm-rx-state-diagram.component';
import { FsmRxDebugLogComponent } from '../fsm-rx-debug-log/fsm-rx-debug-log.component';


type TestStatesA = "state1" | "state2";
type TestStatesB = "state2" | "state3";
type TestStates = TestStatesA | TestStatesB;

interface TestCanLeaveToStatesMap extends CanLeaveToStatesMap<TestStates> {
  FSMInit: "state1",
  state1: "state2",
  state2: "state3",
  state3: "state1";
}

describe('Template reference tests', () => {

  @Component({
    selector: 'host-component',
  })
  class HostComponent { }

  @Component({
    selector: 'has-output-state-diagram-definition-component',
  })
  class HasOutputStateDiagramDefinitionComponent {
    @Output() public outputStateDiagramDefinition: EventEmitter<string | undefined> = new EventEmitter();
  }

  @Component({
    selector: 'test-fsm-rx-component',
  })
  class TestFsmRxComponent extends FsmRxComponent<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>{
    public test: string = "im a child";

    public constructor() {
      console.log("i am alive");
      super({ outputDebugLog: false, outputStateDiagramDefinition: false }, true);
    }

    protected override stateMap: StateMap<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> = {
      state1: {
        canLeaveToStates: { state2: true },
        canEnterFromStates: { FSMInit: true, state3: true }
      },
      state2: {
        canLeaveToStates: { state3: true },
        canEnterFromStates: { state1: true }
      },
      state3: {
        canLeaveToStates: { state1: true },
        canEnterFromStates: { state2: true }
      }
    };

  }

  let fixture: ComponentFixture<HostComponent>;
  let hostComponent: HostComponent;
  let debugSetComponent: FsmRxDebugSetComponent;
  let testFsmRxComponent: TestFsmRxComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostComponent, FsmRxDebugSetComponent, TestFsmRxComponent, FsmRxComponent, HasOutputStateDiagramDefinitionComponent, FsmRxStateDiagramComponent, FsmRxDebugLogComponent]
    }).compileComponents();;

  });

  it('should log an error if a child with the #fsmRxComponent template is not found', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set></fsm-rx-debug-set>");
    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    spyOn(console, "error");
    fixture.detectChanges();
    expect(console.error).toHaveBeenCalledOnceWith("A Content Child that extends FsmRxComponent must be supplied with a #fsmRxComponent template reference.");
  });

  it('should log an error if a child with the #fsmRxComponent template is not of type FsmRxComponent', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><div #fsmRxComponent></div></fsm-rx-debug-set>");
    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    spyOn(console, "error");
    fixture.detectChanges();
    expect(console.error).toHaveBeenCalledOnceWith("A Content Child that extends FsmRxComponent must be supplied with a #fsmRxComponent template reference.");
  });

  it('should log an error if a child with the #fsmRxComponent template has only outputStateDiagramDefinition emitter', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><has-output-state-diagram-definition-component #fsmRxComponent></has-output-state-diagram-definition-component></fsm-rx-debug-set>");
    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    spyOn(console, "error");
    fixture.detectChanges();
    expect(console.error).toHaveBeenCalledOnceWith("A Content Child that extends FsmRxComponent must be supplied with a #fsmRxComponent template reference.");
  });

  it('should bind the value of stateDiagramDefinition to the testFsmRxComponent.outputStateDiagramDefinition emitter', fakeAsync(() => {

    const testString = "TestString";

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxStateDiagramComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();
    testFsmRxComponent.outputStateDiagramDefinition.emit(testString);
    fixture.detectChanges();
    expect(debugSetComponent.stateDiagramDefinition).toEqual(testString);
  }));



})

