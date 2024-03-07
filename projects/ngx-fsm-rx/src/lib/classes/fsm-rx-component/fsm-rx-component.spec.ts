
import { ChangeDetectorRef, Component, Inject, SimpleChange, isDevMode } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject } from "rxjs";
import { RunHelpers, TestScheduler } from 'rxjs/testing';
import { BaseStateData, CanLeaveToStatesMap, DebugLogEntry, FSMInitStateData, FsmConfig, StateMap } from 'fsm-rx';
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
      expect(actual).toEqual(expected);
    });

  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

});

describe("FsmRx FsmComponentConfig", () => {

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
    public constructor(
      @Inject('fsmConfig') fsmConfig: Partial<FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>>,
      @Inject('isInDevMode') isInDevMode: boolean
    ) {
      super(fsmConfig, isInDevMode);
    }

    public override get stateData$(): Observable<BaseStateData<TestStates> | FSMInitStateData> {
      return super.stateData$;
    }

    public get resolvedFSMDebugConfig(): FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> {
      return this.resolvedFsmConfig;
    }
  }

  let fixture: ComponentFixture<FsmSRXComponent>;
  let component: FsmSRXComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1983, 11, 30));

    testScheduler = new TestScheduler((actual, expected) => {
      console.log("actual", actual);
      console.log("expected", expected);
      expect(actual).toEqual(expected);
    });

    await TestBed.configureTestingModule({
      declarations: [FsmSRXComponent],
      providers: [
        { provide: 'fsmConfig', useValue: {} },
        { provide: 'isInDevMode', useValue: true }
      ]
    }).compileComponents();

  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("Should create the default dev mode config when given no values and isInDevMode is true", () => {

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;
    expect(component.resolvedFSMDebugConfig).toEqual(
      {
        outputTransitionRejectionToConsole: true,
        filterRepeatUpdates: true,
        stateOverride: false,
        debugLogBufferCount: Infinity,
        stringifyLogTransitionData: false,
        recordFilteredUpdatesToDebugLog: false,
        resetDebugLogOnOverride: true,
        recordResetDataToDebugLog: true,
        stateDiagramDirection: "TB",
        outputStateDiagramDefinition: true,
        outputDebugLog: true
      }
    );

  });

  it("Should set config values to supplied values when isInDevMode is true", () => {
    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputStateDiagramDefinition: false,
        outputDebugLog: false
      }
    });

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;
    expect(component.resolvedFSMDebugConfig).toEqual(
      {
        outputTransitionRejectionToConsole: true,
        filterRepeatUpdates: true,
        stateOverride: false,
        debugLogBufferCount: Infinity,
        stringifyLogTransitionData: false,
        recordFilteredUpdatesToDebugLog: false,
        resetDebugLogOnOverride: true,
        recordResetDataToDebugLog: true,
        stateDiagramDirection: "TB",
        outputStateDiagramDefinition: false,
        outputDebugLog: false
      }
    );
  });

  it("Should create the default dev mode config when given no values and isInDevMode is false", () => {

    TestBed.overrideProvider('isInDevMode', { useValue: false });
    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;
    expect(component.resolvedFSMDebugConfig).toEqual(
      {
        outputTransitionRejectionToConsole: false,
        filterRepeatUpdates: true,
        stateOverride: false,
        debugLogBufferCount: 0,
        stringifyLogTransitionData: true,
        recordFilteredUpdatesToDebugLog: false,
        resetDebugLogOnOverride: false,
        recordResetDataToDebugLog: false,
        stateDiagramDirection: "TB",
        outputStateDiagramDefinition: false,
        outputDebugLog: false
      }
    );
  });

  it("Should set config values to supplied values when isInDevMode is false", () => {
    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputStateDiagramDefinition: true,
        outputDebugLog: true
      }
    });

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;
    expect(component.resolvedFSMDebugConfig).toEqual(
      {
        outputTransitionRejectionToConsole: true,
        filterRepeatUpdates: true,
        stateOverride: false,
        debugLogBufferCount: Infinity,
        stringifyLogTransitionData: false,
        recordFilteredUpdatesToDebugLog: false,
        resetDebugLogOnOverride: true,
        recordResetDataToDebugLog: true,
        stateDiagramDirection: "TB",
        outputStateDiagramDefinition: true,
        outputDebugLog: true
      }
    );
  });

  it("Should emit the debug log if outputDebugLog in the config is true", () => {

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;
    testScheduler.schedule(() => { fixture.detectChanges(); }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.outputDebugLog).toBe('-a', {
        a: [{ message: 'success', result: 'success', timeStamp: 441550800000, stateData: Object({ state: 'FSMInit' }), transitionType: 'init' }]
      });
    });

  });

  it("Should not emit the debug log if outputDebugLog in the config is false", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputDebugLog: false
      }
    });

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;

    spyOn(component.outputDebugLog, 'emit');
    fixture.detectChanges();
    expect(component.outputDebugLog.emit).not.toHaveBeenCalled();
  });

  it("Should emit the getStateDiagramDefinition if outputDebugLog in the outputStateDiagramDefinition is true", () => {

    let expectedString: string = "stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit:::highlight --> state1\nstate1 --> state2\nstate2 --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1";
    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;
    testScheduler.schedule(() => { fixture.detectChanges(); }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.outputStateDiagramDefinition).toBe('-a', {
        a: expectedString
      });
    });
  });

  it("Should not emit the getStateDiagramDefinition if outputDebugLog in the outputStateDiagramDefinition is false", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputStateDiagramDefinition: false
      }
    });

    fixture = TestBed.createComponent(FsmSRXComponent);
    component = fixture.componentInstance;

    spyOn(component.outputStateDiagramDefinition, 'emit');
    fixture.detectChanges();
    expect(component.outputStateDiagramDefinition.emit).not.toHaveBeenCalled();
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
    public constructor(
      @Inject('fsmConfig') fsmConfig: Partial<FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>>,
      @Inject('isInDevMode') isInDevMode: boolean
    ) {
      super(fsmConfig, isInDevMode);
    }

    public get resolvedFSMDebugConfig(): FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> {
      return this.resolvedFsmConfig;
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
    template: '<fsm-component [fsmConfig]="hostFsmConfig"></fsm-component>',
  })
  class TestHostComponent {
    constructor() { }
    public hostFsmConfig: Partial<FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>> = {};
  }

  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let component: FsmSRXComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1983, 11, 30));

    await TestBed.configureTestingModule({
      declarations: [FsmSRXComponent, TestHostComponent],
      providers: [
        { provide: 'hostFsmConfig', useValue: {} },
        { provide: 'fsmConfig', useValue: {} },
        { provide: 'isInDevMode', useValue: true }
      ]
    }).compileComponents();

    testScheduler = new TestScheduler((actual, expected) => {
      console.log("actual", actual);
      console.log("expected", expected);
      expect(actual).toEqual(expected);
    });

  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("Should call ngOnChanges when a value for the fsmConfig input is given", () => {

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    const ngOnChangesSpy = spyOn(component, 'ngOnChanges');
    let newFsmDebugConfig: Partial<FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>> = {
      outputStateDiagramDefinition: false,
      outputDebugLog: false
    };
    hostComponent.hostFsmConfig = newFsmDebugConfig;
    fixture.detectChanges();
    expect(ngOnChangesSpy).toHaveBeenCalledWith({
      fsmConfig: new SimpleChange(undefined, newFsmDebugConfig, true)
    });
  });

  it("Should throw a warning when a value for the fsmConfig input is given in production", () => {
    TestBed.overrideProvider('isInDevMode', { useValue: false });
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    spyOn(console, 'warn');
    fixture.detectChanges();
    expect(console.warn).toHaveBeenCalledWith("fsmConfig @Input is not supported in production");
  });

  it("Should override the state when a value for fsmConfig.stateOverride is given", () => {

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    testScheduler.schedule(() => {
      component.changeState({ state: "state1" });
    }, 1);

    testScheduler.schedule(() => {
      hostComponent.hostFsmConfig = {
        stateOverride: {
          stateData: { state: "state3" }
        }
      };
      fixture.detectChanges();
    }, 2);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.stateData$).toBe('abc', {
        a: { state: 'FSMInit' },
        b: { state: 'state1' },
        c: { state: 'state3' },
      });
    });

  });

  it("Should emit the debugLog when outputDebugLog is changed to true via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputDebugLog: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    testScheduler.schedule(() => {
      hostComponent.hostFsmConfig = { outputDebugLog: true };
      fixture.detectChanges();
    }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.outputDebugLog).toBe('-a', {
        a: [{ message: 'success', result: 'success', timeStamp: 441550800000, stateData: Object({ state: 'FSMInit' }), transitionType: 'init' }]
      });
    });

  });

  it("Should emit undefined when outputDebugLog is changed to false via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputDebugLog: true }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    testScheduler.schedule(() => {
      hostComponent.hostFsmConfig = { outputDebugLog: false };
      fixture.detectChanges();
    }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.outputDebugLog).toBe('-a', {
        a: undefined
      });
    });

  });

  it("Should emit the undefined when outputDebugLog is changed to false via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputDebugLog: true }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    testScheduler.schedule(() => {
      hostComponent.hostFsmConfig = { outputDebugLog: false };
      fixture.detectChanges();
    }, 1);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.outputDebugLog).toBe('-a', {
        a: undefined
      });
    });

  });

  it("should do crap", () => {

    let outputDebugLogEmission$: Subject<DebugLogEntry<TestStates, BaseStateData<TestStates>>[] | undefined> = new Subject();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    component.outputDebugLog.subscribe((x) => {
      outputDebugLogEmission$.next(x ? x.slice() : undefined);
    });

    fixture.detectChanges();

    testScheduler.schedule(() => {
      jasmine.clock().tick(1);
      component.changeState({ state: "state1" });
    }, 1);

    testScheduler.schedule(() => {
      jasmine.clock().tick(1);
      component.changeState({ state: "state2" });
    }, 2);

    testScheduler.schedule(() => {
      jasmine.clock().tick(1);
      hostComponent.hostFsmConfig = { debugLogBufferCount: 1 };
      fixture.detectChanges();
    }, 3);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(outputDebugLogEmission$).toBe('-abc', {
        a: [
          { message: 'success', result: 'success', timeStamp: 441550800000, stateData: { state: 'FSMInit' }, transitionType: 'init' },
          { message: 'success', result: 'success', timeStamp: 441550800001, stateData: { state: 'state1' }, transitionType: 'change' }
        ],
        b: [
          { message: 'success', result: 'success', timeStamp: 441550800000, stateData: { state: 'FSMInit' }, transitionType: 'init' },
          { message: 'success', result: 'success', timeStamp: 441550800001, stateData: { state: 'state1' }, transitionType: 'change' },
          { message: 'success', result: 'success', timeStamp: 441550800002, stateData: { state: 'state2' }, transitionType: 'change' }
        ],
        c: [
          { message: 'success', result: 'success', timeStamp: 441550800002, stateData: { state: 'state2' }, transitionType: 'change' }
        ]
      });
    });

  });

});
