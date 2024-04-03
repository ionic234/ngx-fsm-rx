
import { Component, Inject, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BaseStateData, CanLeaveToStatesMap, DebugLogEntry, FSMInitStateData, StateMap } from 'fsm-rx';
import { Observable, Subject } from "rxjs";
import { RunHelpers, TestScheduler } from 'rxjs/testing';
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
    selector: 'test-fsm-rx-component',
    template: '',
  })
  class TestFsmRxComponent extends FsmRxComponent<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> {
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

  let fixture: ComponentFixture<TestFsmRxComponent>;
  let component: TestFsmRxComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [TestFsmRxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestFsmRxComponent);
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
  class TestFsmRxComponent extends FsmRxComponent<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap> {
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

    public override changeState(transitionData: BaseStateData<TestStates>): void {
      super.changeState(transitionData);
    }
  }

  let fixture: ComponentFixture<TestFsmRxComponent>;
  let component: TestFsmRxComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(Date.UTC(1983, 11, 30, 0, 0, 0, 0)));

    testScheduler = new TestScheduler((actual, expected) => {
      console.log("actual", actual);
      console.log("expected", expected);
      expect(actual).toEqual(expected);
    });

    await TestBed.configureTestingModule({
      declarations: [TestFsmRxComponent],
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

    fixture = TestBed.createComponent(TestFsmRxComponent);
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

    fixture = TestBed.createComponent(TestFsmRxComponent);
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

  it("Should create the default production mode config when given no values and isInDevMode is false", () => {

    TestBed.overrideProvider('isInDevMode', { useValue: false });
    fixture = TestBed.createComponent(TestFsmRxComponent);
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

    fixture = TestBed.createComponent(TestFsmRxComponent);
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

    fixture = TestBed.createComponent(TestFsmRxComponent);
    component = fixture.componentInstance;

    spyOn(component.outputDebugLog, 'emit');
    fixture.detectChanges();
    expect(component.outputDebugLog.emit).toHaveBeenCalledOnceWith([{ message: 'success', result: 'success', timeStamp: 441590400000, stateData: Object({ state: 'FSMInit' }), transitionType: 'init' }]);
  });

  it("Should not emit the debug log if outputDebugLog in the config is false", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputDebugLog: false
      }
    });

    fixture = TestBed.createComponent(TestFsmRxComponent);
    component = fixture.componentInstance;

    spyOn(component.outputDebugLog, 'emit');
    fixture.detectChanges();
    expect(component.outputDebugLog.emit).not.toHaveBeenCalled();
  });

  it("Should emit the State Diagram Definition if outputDebugLog in the outputStateDiagramDefinition is true", () => {

    let expectedString: string = "stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit:::highlight --> state1\nstate1 --> state2\nstate2 --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1";
    fixture = TestBed.createComponent(TestFsmRxComponent);
    component = fixture.componentInstance;

    spyOn(component.outputStateDiagramDefinition, 'emit');
    fixture.detectChanges();
    expect(component.outputStateDiagramDefinition.emit).toHaveBeenCalledOnceWith(expectedString);

  });

  it("Should emit the State Diagram Definition if outputDebugLog in the outputStateDiagramDefinition is true on every state change", () => {

    fixture = TestBed.createComponent(TestFsmRxComponent);
    component = fixture.componentInstance;

    let outputStateDiagramDefinition$: Subject<string | undefined> = new Subject();

    component.outputStateDiagramDefinition.subscribe((x) => {
      outputStateDiagramDefinition$.next(x);
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
      component.changeState({ state: "state3" });
    }, 3);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(outputStateDiagramDefinition$).toBe('-abc', {
        a: "stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit --> state1\nstate1:::highlight --> state2\nstate2 --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1",
        b: "stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit --> state1\nstate1 --> state2\nstate2:::highlight --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1",
        c: "stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit --> state1\nstate1 --> state2\nstate2 --> state3\nstate3:::highlight --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1"
      });
    });
  });

  it("Should not emit the State Diagram Definition if outputDebugLog in the outputStateDiagramDefinition is false", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputStateDiagramDefinition: false
      }
    });

    fixture = TestBed.createComponent(TestFsmRxComponent);
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
  class TestFsmRxComponent extends FsmRxComponent<
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

    public override get debugLog(): DebugLogEntry<TestStates, BaseStateData<TestStates>>[] {
      return super.debugLog;
    }

  }

  @Component({
    selector: 'lib-test-host',
    template: '<fsm-component [fsmConfig]="hostFsmConfig"></fsm-component>',
  })
  class TestHostComponent {
    public hostFsmConfig: Partial<FsmComponentConfig<TestStates, BaseStateData<TestStates>, TestCanLeaveToStatesMap>> = {};
    constructor() { }

  }

  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let component: TestFsmRxComponent;
  let testScheduler: TestScheduler;

  beforeEach(async () => {

    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(Date.UTC(1983, 11, 30, 0, 0, 0, 0)));

    await TestBed.configureTestingModule({
      declarations: [TestFsmRxComponent, TestHostComponent],
      providers: [
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

  it("Should call ngOnChanges when a value for the fsmConfig input is applied", () => {

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

  it("Should throw a warning when a value for the fsmConfig input is applied in production", () => {
    TestBed.overrideProvider('isInDevMode', { useValue: false });
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    spyOn(console, 'warn');
    fixture.detectChanges();
    expect(console.warn).toHaveBeenCalledWith("fsmConfig @Input is not supported in production");
  });

  it("Should only change the values updated by the fsmConfig input", () => {
    TestBed.overrideProvider('isInDevMode', { useValue: true });
    TestBed.overrideProvider('fsmConfig', {
      useValue: {
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
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    fixture.detectChanges();

    hostComponent.hostFsmConfig = {
      filterRepeatUpdates: false,
      stateDiagramDirection: "LR",
      resetDebugLogOnOverride: true,
      recordResetDataToDebugLog: true,
    };
    fixture.detectChanges();

    expect(component.resolvedFSMDebugConfig).toEqual(
      {
        outputTransitionRejectionToConsole: false,
        filterRepeatUpdates: false,
        stateOverride: false,
        debugLogBufferCount: 0,
        stringifyLogTransitionData: true,
        recordFilteredUpdatesToDebugLog: false,
        resetDebugLogOnOverride: true,
        recordResetDataToDebugLog: true,
        stateDiagramDirection: "LR",
        outputStateDiagramDefinition: false,
        outputDebugLog: false
      }
    );

  });

  it("Should override the state when a value for fsmConfig.stateOverride is applied", () => {

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

  it("Should cap the debug log when a value for fsmConfig.debugLogBufferCount is applied", () => {

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    fixture.detectChanges();
    jasmine.clock().tick(1);
    component.changeState({ state: "state1" });
    jasmine.clock().tick(1);
    component.changeState({ state: "state2" });

    jasmine.clock().tick(1);
    hostComponent.hostFsmConfig = { debugLogBufferCount: 1 };
    fixture.detectChanges();
    expect(component.debugLog).toEqual([{ message: 'success', result: 'success', timeStamp: 441590400002, stateData: { state: 'state2' }, transitionType: 'change' }]);

  });

  it("should emit the debug log when a value for fsmConfig.debugLogBufferCount is applied", () => {

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    let outputDebugLogEmission$: Subject<DebugLogEntry<TestStates, BaseStateData<TestStates>>[] | undefined> = new Subject();

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
          { message: 'success', result: 'success', timeStamp: 441590400000, stateData: { state: 'FSMInit' }, transitionType: 'init' },
          { message: 'success', result: 'success', timeStamp: 441590400001, stateData: { state: 'state1' }, transitionType: 'change' }
        ],
        b: [
          { message: 'success', result: 'success', timeStamp: 441590400000, stateData: { state: 'FSMInit' }, transitionType: 'init' },
          { message: 'success', result: 'success', timeStamp: 441590400001, stateData: { state: 'state1' }, transitionType: 'change' },
          { message: 'success', result: 'success', timeStamp: 441590400002, stateData: { state: 'state2' }, transitionType: 'change' }
        ],
        c: [
          { message: 'success', result: 'success', timeStamp: 441590400002, stateData: { state: 'state2' }, transitionType: 'change' }
        ]
      });
    });

  });

  it("should not emit the debug log when a value for fsmConfig.debugLogBufferCount is applied but outputDebugLog is false", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: {
        outputDebugLog: false
      }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;

    fixture.detectChanges();
    jasmine.clock().tick(1);
    component.changeState({ state: "state1" });
    jasmine.clock().tick(1);
    component.changeState({ state: "state2" });

    spyOn(component.outputDebugLog, 'emit');
    jasmine.clock().tick(1);
    hostComponent.hostFsmConfig = { debugLogBufferCount: 1 };
    fixture.detectChanges();
    expect(component.outputDebugLog.emit).not.toHaveBeenCalled();

  });

  it("Should emit the debugLog when outputDebugLog is changed to true via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputDebugLog: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    spyOn(component.outputDebugLog, 'emit');
    hostComponent.hostFsmConfig = { outputDebugLog: true };
    fixture.detectChanges();
    expect(component.outputDebugLog.emit).toHaveBeenCalledOnceWith([{ message: 'success', result: 'success', timeStamp: 441590400000, stateData: Object({ state: 'FSMInit' }), transitionType: 'init' }]);

  });

  it("Should emit undefined when outputDebugLog is changed to false via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputDebugLog: true }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    spyOn(component.outputDebugLog, 'emit');
    hostComponent.hostFsmConfig = { outputDebugLog: false };
    fixture.detectChanges();
    expect(component.outputDebugLog.emit).toHaveBeenCalledOnceWith(undefined);
  });

  it("Should emit the State Diagram Definition when outputStateDiagramDefinition is changed to true via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputStateDiagramDefinition: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    spyOn(component.outputStateDiagramDefinition, 'emit');
    hostComponent.hostFsmConfig = { outputStateDiagramDefinition: true };
    fixture.detectChanges();
    expect(component.outputStateDiagramDefinition.emit).toHaveBeenCalledOnceWith("stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit:::highlight --> state1\nstate1 --> state2\nstate2 --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1");

  });

  it("Should emit undefined when outputStateDiagramDefinition is changed to false via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { outputStateDiagramDefinition: true }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    spyOn(component.outputStateDiagramDefinition, 'emit');
    hostComponent.hostFsmConfig = { outputStateDiagramDefinition: false };
    fixture.detectChanges();
    expect(component.outputStateDiagramDefinition.emit).toHaveBeenCalledOnceWith(undefined);

  });

  it("Should emit the State Diagram Definition when stateDiagramDirection is changed via the fsmConfig input", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { stateDiagramDirection: "TB", outputStateDiagramDefinition: true }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    spyOn(component.outputStateDiagramDefinition, 'emit');
    hostComponent.hostFsmConfig = { stateDiagramDirection: "LR" };
    fixture.detectChanges();
    expect(component.outputStateDiagramDefinition.emit).toHaveBeenCalledOnceWith("stateDiagram-v2\ndirection LR\n[*] --> FSMInit\nFSMInit:::highlight --> state1\nstate1 --> state2\nstate2 --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1");

  });

  it("Should not emit the State Diagram Definition when stateDiagramDirection is changed via the fsmConfig input but outputStateDiagramDefinition is false", () => {

    TestBed.overrideProvider('fsmConfig', {
      useValue: { stateDiagramDirection: "TB", outputStateDiagramDefinition: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('fsm-component')).componentInstance;
    fixture.detectChanges();

    spyOn(component.outputStateDiagramDefinition, 'emit');
    hostComponent.hostFsmConfig = { stateDiagramDirection: "LR" };
    fixture.detectChanges();
    expect(component.outputStateDiagramDefinition.emit).not.toHaveBeenCalled();

  });


});
