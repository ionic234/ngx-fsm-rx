import { Component, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BaseStateData, CanLeaveToStatesMap, DebugLogEntry, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx/src/lib/classes/fsm-rx-component/fsm-rx-component';
import { FsmRxDebugLogComponent } from 'ngx-fsm-rx/testing';
import { FsmRxStateDiagramComponent } from 'ngx-fsm-rx/testing';
import { FsmRxDebugSetComponent } from 'ngx-fsm-rx/testing';

type TestStates = "state1";

interface TestCanLeaveToStatesMap extends CanLeaveToStatesMap<TestStates> {
  FSMInit: "state1",
  state1: "FSMTerminate",
}

interface TestData extends BaseStateData<TestStates> {
  someString: string,
  someNumber: number,
  someBool: boolean;
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
  class TestFsmRxComponent extends FsmRxComponent<TestStates, TestData, TestCanLeaveToStatesMap>{

    public constructor() {
      super({ outputDebugLog: false, outputStateDiagramDefinition: false }, true);
    }

    protected override stateMap: StateMap<TestStates, TestData, TestCanLeaveToStatesMap> = {
      state1: {
        canLeaveToStates: { FSMTerminate: true },
        canEnterFromStates: { FSMInit: true }
      },
    };

  }

  let fixture: ComponentFixture<HostComponent>;
  let hostComponent: HostComponent;
  let debugSetComponent: FsmRxDebugSetComponent;
  let testFsmRxComponent: TestFsmRxComponent;

  beforeEach(async () => {

    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(Date.UTC(1983, 11, 30, 0, 0, 0, 0)));

    await TestBed.configureTestingModule({
      declarations: [HostComponent, FsmRxDebugSetComponent, TestFsmRxComponent, FsmRxComponent, HasOutputStateDiagramDefinitionComponent, FsmRxStateDiagramComponent, FsmRxDebugLogComponent]
    }).compileComponents();;

  });

  afterEach(() => {
    jasmine.clock().uninstall();
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

  it('should bind the value of stateDiagramDefinition to an FsmRxComponent.outputStateDiagramDefinition emitter', () => {

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
  });

  it('should process the debug log when emitted by an FsmRxComponent.outputDebugLog emitter ', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1",\n "someBool": true,\n "someNumber": 10,\n "someString": "test"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: JSON.stringify(data, null, 1),
      message: "success",
      result: "success",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'success' }]);

  });

  it('should set debug log to undefined when FsmRxComponent.outputDebugLog emits undefined', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();
    testFsmRxComponent.outputDebugLog.emit(undefined);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual(undefined);
  });

  it('should filter data object to only include "state" when a value for debugLogKeys is not given', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "success",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'success' }]);

  });

  it('should filter data object to only include the values in debugLogKeys when given', () => {

    TestBed.overrideTemplate(HostComponent, `<fsm-rx-debug-set [debugLogKeys]="['someNumber','someString']"><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>`);
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "someNumber": 10,\n "someString": "test"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "success",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'success' }]);

  });

  it('should correctly filter data object if debugLogKeys contains a key not found in the data', () => {

    TestBed.overrideTemplate(HostComponent, `<fsm-rx-debug-set [debugLogKeys]="['someNumber','someString', 'illegal Key']"><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>`);
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "someNumber": 10,\n "someString": "test"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "success",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'success' }]);

  });

  it('should return the result as "override" when given "override"', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "override",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'override' }]);

  });

  it('should return the result as "reset" when given "reset"', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "reset",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'reset' }]);

  });

  it('should return the result as "error" when given "internal_error"', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "internal_error",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'error' }]);

  });

  it('should return the result as "error" when given "unknown_error"', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "unknown_error",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'error' }]);

  });

  it('should return the result as "warning" when given a TransitionRejectionReasons', () => {

    TestBed.overrideTemplate(HostComponent, "<fsm-rx-debug-set><test-fsm-rx-component #fsmRxComponent></test-fsm-rx-component></fsm-rx-debug-set>");
    TestBed.overrideComponent(FsmRxDebugLogComponent, { set: { template: '<div></div>' } });

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;

    debugSetComponent = fixture.debugElement.query(By.css('fsm-rx-debug-set')).componentInstance;
    testFsmRxComponent = fixture.debugElement.query(By.css('test-fsm-rx-component')).componentInstance;

    fixture.detectChanges();

    const data: TestData = {
      state: "state1",
      someBool: true,
      someNumber: 10,
      someString: "test"
    };

    let dataAsString = '{\n "state": "state1"\n}';

    const entryToEmit: DebugLogEntry<TestStates, TestData> = {
      stateData: data,
      message: "success",
      result: "illegal_change_same_state",
      timeStamp: Date.now(),
      transitionType: 'change'
    };

    testFsmRxComponent.outputDebugLog.emit([entryToEmit]);
    fixture.detectChanges();
    expect(debugSetComponent.debugLog).toEqual([{ time: '12:00:00.000 am', type: 'change', data: dataAsString, message: 'success', result: 'warning' }]);

  });



})

