
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import mermaid from 'mermaid';
import { UniqueDataService } from '../../services/unique-data/unique-data.service';

@Component({
  selector: 'fsm-rx-state-diagram',
  templateUrl: './fsm-rx-state-diagram.component.html',
  styleUrls: ['./fsm-rx-state-diagram.component.scss']
})
export class FsmRxStateDiagramComponent implements OnChanges {

  @Input({ required: true }) public stateDiagramDefinition!: string;

  public canvasId: string = `canvas_${this.uniqueDataService.generateUID()}`;

  private canvas: ElementRef<HTMLDivElement> | undefined;
  @ViewChild('canvas', { static: false }) set _canvas(canvas: ElementRef<HTMLDivElement>) {
    this.canvas = canvas;
    if (this.stateDiagramDefinition) {
      this.renderDiagram(this.canvasId, this.stateDiagramDefinition, canvas.nativeElement);
    }
  }

  public constructor(private uniqueDataService: UniqueDataService) { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.canvas && changes["stateDiagramDefinition"] && changes["stateDiagramDefinition"].currentValue) {
      this.renderDiagram(this.canvasId, changes["stateDiagramDefinition"].currentValue, this.canvas.nativeElement);
    }
  }

  private async renderDiagram(
    id: string,
    stateDiagramDefinition: string,
    nativeElement: HTMLDivElement
  ) {
    const { svg } = await mermaid.render(id, stateDiagramDefinition);
    nativeElement.innerHTML = svg;
  }

}