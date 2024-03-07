
import { ChangeDetectorRef, Component, DebugElement, Inject, OnChanges, SimpleChange, SimpleChanges, isDevMode } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject } from "rxjs";
import { RunHelpers, TestScheduler } from 'rxjs/testing';
import { BaseStateData, CanLeaveToStatesMap, DebugLogEntry, FSMInitStateData, FsmConfig, StateMap } from 'fsm-rx';
import { FsmRxStateDiagramComponent } from './fsm-rx-state-diagram.component';
import mermaid, { RenderResult } from 'mermaid';



describe('FsmRxStateDiagramComponent', () => {

  @Component({
    selector: 'test-fsm-rx-state-diagram',
    template: '<div #canvas></div>',
  })
  class TestFsmRxStateDiagramComponent extends FsmRxStateDiagramComponent {
    public override async renderDiagram(id: string, stateDiagramDefinition: string, nativeElement: HTMLDivElement): Promise<string> {
      return super.renderDiagram(id, stateDiagramDefinition, nativeElement);
    }
  }

  @Component({
    selector: 'lib-test-host',
    template: '<test-fsm-rx-state-diagram [stateDiagramDefinition]="hostStateDiagramDefinition"></test-fsm-rx-state-diagram>',
  })
  class TestHostComponent {
    constructor(@Inject('hostStateDiagramDefinition') public hostStateDiagramDefinition: string | undefined) { }
  }

  const uuid: `${string}-${string}-${string}-${string}-${string}` = "502910c1-e1b0-454d-8fc7-053ec0e583d3";

  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let component: TestFsmRxStateDiagramComponent;

  const diagramDef: string = "stateDiagram-v2\ndirection TB\n[*] --> FSMInit\nFSMInit:::highlight --> state1\nstate1 --> state2\nstate2 --> state3\nstate3 --> state1\nclassDef highlight font-weight:bold,stroke-width:3px,fill:#c6c6f9,stroke:#7d4ce1";

  beforeEach(async () => {

    spyOn(crypto, 'randomUUID').and.returnValue(uuid);

    await TestBed.configureTestingModule({
      declarations: [TestFsmRxStateDiagramComponent, TestHostComponent],
      providers: [
        { provide: 'hostStateDiagramDefinition', useValue: "" },
      ]
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.css('test-fsm-rx-state-diagram')).componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Should call renderDiagram when canvas is found and hostStateDiagramDefinition is set', () => {

    TestBed.overrideProvider('hostStateDiagramDefinition', { useValue: diagramDef });
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    const diagramElement: DebugElement = fixture.debugElement.query(By.css('test-fsm-rx-state-diagram'));
    component = diagramElement.componentInstance;

    const canvas: HTMLDivElement = diagramElement.nativeNode.children[0];
    spyOn(component, 'renderDiagram');
    fixture.detectChanges();

    expect(component.renderDiagram).toHaveBeenCalledOnceWith(`canvas_${uuid}`, diagramDef, canvas);

  });

  it('Should call renderDiagram when canvas is found and hostStateDiagramDefinition is set through the stateDiagramDefinition input', () => {

    //TestBed.overrideProvider('hostStateDiagramDefinition', { useValue: diagramDef });
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    const diagramElement: DebugElement = fixture.debugElement.query(By.css('test-fsm-rx-state-diagram'));
    component = diagramElement.componentInstance;

    const canvas: HTMLDivElement = diagramElement.nativeNode.children[0];
    spyOn(component, 'renderDiagram');
    fixture.detectChanges();
    hostComponent.hostStateDiagramDefinition = diagramDef;
    fixture.detectChanges();
    expect(component.renderDiagram).toHaveBeenCalledOnceWith(`canvas_${uuid}`, diagramDef, canvas);

  });

  it('should successfuly inject svg string into the canvas when renderDiagram is called', async () => {

    spyOn(mermaid, "render").and.callFake(() => {
      return new Promise<RenderResult>((resolve) => { resolve({ svg: "fake svg" }); });
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    const diagramElement: DebugElement = fixture.debugElement.query(By.css('test-fsm-rx-state-diagram'));
    component = diagramElement.componentInstance;

    const canvas: HTMLDivElement = diagramElement.nativeNode.children[0];
    fixture.detectChanges();

    const svg = await component.renderDiagram(`canvas_${uuid}`, diagramDef, canvas);
    expect(canvas.innerHTML).toEqual(svg);

  });




});

