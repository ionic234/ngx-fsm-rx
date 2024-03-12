
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import mermaid from 'mermaid';
import { UniqueDataService } from 'ngx-fsm-rx/utils';

/** 
 * An angular component for rendering state diagrams using mermaid.  
 */
@Component({
  selector: 'fsm-rx-state-diagram',
  templateUrl: './fsm-rx-state-diagram.component.html',
  styleUrls: ['./fsm-rx-state-diagram.component.scss']
})
export class FsmRxStateDiagramComponent implements OnChanges {

  @Input() public stateDiagramDefinition!: string;

  public canvasId: string = `canvas_${this.uniqueDataService.generateUUID()}`;

  private canvas: ElementRef<HTMLDivElement> | undefined;
  /**
   * A setter for _canvas that executes when a child containing #canvas is found.
   * It will automatically render a state diagram if one is set via the stateDiagramDefinition @Input on discovery. 
   */
  @ViewChild('canvas', { static: false }) private set _canvas(canvas: ElementRef<HTMLDivElement>) {
    this.canvas = canvas;
    if (this.canvas && this.stateDiagramDefinition) {
      this.renderDiagram(this.canvasId, this.stateDiagramDefinition, canvas.nativeElement);
    }
  }

  /**
   * Constructor for FsmRxStateDiagramComponent
   * @param uniqueDataService Inject the UniqueDataService for use in the component. 
   */
  public constructor(private uniqueDataService: UniqueDataService) { }

  /**
   * Implementation of the OnChanges lifecycle hook. 
   * Renders the diagram when the stateDiagramDefinition changes. 
   * @param changes  The changes angular has detected. 
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if (this.canvas && changes["stateDiagramDefinition"] && changes["stateDiagramDefinition"].currentValue) {
      this.renderDiagram(this.canvasId, changes["stateDiagramDefinition"].currentValue, this.canvas.nativeElement);
    }
  }

  /**
   * Render the State Diagram in mermaid format. Can be overridden to use a different diagram rendering engine. 
   * @param id The ID of the canvas to render to. 
   * @param stateDiagramDefinition The state diagram definition to render. 
   * @param nativeElement The Native element of the canvas to render to.
   * @returns The svg string
   */
  protected async renderDiagram(
    id: string,
    stateDiagramDefinition: string,
    nativeElement: HTMLDivElement
  ): Promise<string> {
    const { svg } = await mermaid.render(id, stateDiagramDefinition);
    nativeElement.innerHTML = svg;
    return svg;
  }

}