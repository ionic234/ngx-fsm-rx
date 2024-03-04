
import { Component, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable } from "rxjs";
import { RunHelpers, TestScheduler } from 'rxjs/testing';
import { BaseStateData, CanLeaveToStatesMap, FSMInitStateData, FsmConfig, StateMap } from 'fsm-rx';
import { FsmRxComponent } from './fsm-rx-component';
import { FsmComponentConfig } from './fsm-rx-component.types';


type TestStatesA = "state1" | "state2";
type TestStatesB = "state2" | "state3";
type TestStates = TestStatesA | TestStatesB;

interface TestCanLeaveToStatesMap extends CanLeaveToStatesMap<TestStates> {
  FSMInit: "state1",
  state1: "state2",
  state2: "state3",
  state3: "state1";
}

describe("FsmRX Component lifecycle", () => {
  @Component({
    selector: 'fsm-rx-component',
    template: '',
  })
  class FsmSRXComponent extends FsmRxComponent<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> {
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
    public constructor() {
      super({}, true);
    }

    public override get stateData$(): Observable<BaseStateData<TestStates> | FSMInitStateData> {
      return super.stateData$;
    }

    public override changeState(transitionData: BaseStateData<TestStates>): void {
      super.changeState(transitionData);
    }
  }

  let fixture: ComponentFixture<FsmSRXComponent>;
  let component: FsmSRXComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [FsmSRXComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;

    testScheduler = new TestScheduler((actual, expected) => {
      //console.log("actual", actual);
      //console.log("expected", expected);
      expect(actual).toEqual(expected);
    });

  });

  it('stateData$ Should complete when component is destroyed', () => {
    testScheduler.schedule(() => { fixture.destroy(); }, 1);
    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.stateData$).toBe('a|', {
        a: { state: "FSMInit" }
      });
    });
  });

  it('stateTransitionObservable$ Should complete when component is destroyed', () => {
    // @ts-ignore - We need to test that this private stream is completed on destroy
    const stateTransitionObservable$ = component.stateTransitionObservable$;

    testScheduler.schedule(() => { fixture.destroy(); }, 1);
    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(stateTransitionObservable$).toBe('-|',);
    });
  });

  it('_stateData$ subject Should complete when component is destroyed', () => {
    // @ts-ignore - We need to test that this private stream is completed on destroy
    const _stateData$ = component.stateTransition$;
    testScheduler.schedule(() => { fixture.destroy(); }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { cold } = runHelpers;
      cold("-|").subscribe({
        complete: () => {
          expect(_stateData$.closed).toBeTrue();
        }
      });
    });
  });

  it('stateTransition$ subject Should complete when component is destroyed', () => {
    // @ts-ignore - We need to test that this private stream is completed on destroy
    const stateTransition$ = component.stateTransition$;
    testScheduler.schedule(() => { fixture.destroy(); }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { cold } = runHelpers;
      cold("-|").subscribe({
        complete: () => {
          expect(stateTransition$.closed).toBeTrue();
        }
      });
    });
  });

});

describe("FsmRX Component input tests", () => {

  @Component({
    selector: 'fsm-component',
    template: '',
  })
  class FsmSRXComponent extends FsmRxComponent<
    TestStates,
    BaseStateData<TestStates>,
    TestCanLeaveToStatesMap
  > {
    protected override stateMap: StateMap<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> = {
      state1: {
        canEnterFromStates: { FSMInit: true, state3: true },
        canLeaveToStates: { state2: true }
      },
      state2: {
        canEnterFromStates: { state1: true },
        canLeaveToStates: { state3: true },
      },
      state3: {
        canEnterFromStates: { state2: true },
        canLeaveToStates: { state1: true },
      }
    };
    public constructor() {
      super({}, true);
    }

    public override get stateData$(): Observable<BaseStateData<TestStates> | FSMInitStateData> {
      return super.stateData$;
    }

    public override changeState(transitionData: BaseStateData<TestStates>): void {
      super.changeState(transitionData);
    }

  }

  @Component({
    selector: 'lib-test-host',
    template: '<fsm-component [fsmConfig]="fsmConfig"></fsm-component>',
  })
  class TestHostComponent {
    public fsmConfig: Partial<FsmConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>> = {};
  }

  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let component: FsmSRXComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [FsmSRXComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    testScheduler = new TestScheduler((actual, expected) => {
      console.log("actual", actual);
      console.log("expected", expected);
      expect(actual).toEqual(expected);
    });

  });

  xit("Should call ngOnChanges when a value for the fsmConfig input is given", () => {

    const ngOnChangesSpy = spyOn(component, 'ngOnChanges');//.and.callThrough();
    const initialFsmDebugConfig: FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> = (component as any)['fsmDebugConfig'];

    //Flip all the boolean values
    const newFsmDebugConfig: FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> = {
      ...initialFsmDebugConfig,
      filterRepeatUpdates: !initialFsmDebugConfig.filterRepeatUpdates,
      stringifyLogTransitionData: !initialFsmDebugConfig.stringifyLogTransitionData,
      resetDebugLogOnOverride: !initialFsmDebugConfig.resetDebugLogOnOverride,
      recordFilteredUpdatesToDebugLog: !initialFsmDebugConfig.recordFilteredUpdatesToDebugLog,
      recordResetDataToDebugLog: !initialFsmDebugConfig.recordResetDataToDebugLog,
      outputDebugLog: !initialFsmDebugConfig.outputDebugLog,
      outputStateDiagramDefinition: !initialFsmDebugConfig.outputStateDiagramDefinition,
      outputTransitionRejectionToConsole: !initialFsmDebugConfig.outputTransitionRejectionToConsole
    };

    hostComponent.fsmConfig = newFsmDebugConfig;
    fixture.detectChanges();

    expect(ngOnChangesSpy).toHaveBeenCalledWith({
      fsmConfig: new SimpleChange(undefined, newFsmDebugConfig, true)
    });

  });

  it("Should override the state when a value for fsmConfig.stateOverride is given", () => {

    testScheduler.schedule(() => {
      component.changeState({ state: "state1" });
    }, 1);

    testScheduler.schedule(() => {
      hostComponent.fsmConfig = {
        stateOverride: {
          stateData: { state: "state3" }
        }
      };
      fixture.detectChanges();
    }, 2);

    testScheduler.schedule(() => {
      component.changeState({ state: "state1" });
    }, 3);


    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.stateData$).toBe('abcd', {
        a: { state: 'FSMInit' },
        b: { state: 'state1' },
        c: { state: 'state3' },
        d: { state: 'state1' },
      });
    });

  });

});
