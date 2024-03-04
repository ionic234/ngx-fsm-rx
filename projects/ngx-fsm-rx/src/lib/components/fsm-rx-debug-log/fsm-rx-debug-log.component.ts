import { Component, Input } from '@angular/core';
import { TransitionTypes } from 'fsm-rx';

export type DebugEntryResult = "success" | "error" | "warning" | "filtered" | 'override' | 'reset';

export type SimpleDebugEntry = {
  time: string,
  type: TransitionTypes,
  data: string,
  message: string,
  result: DebugEntryResult;
};

@Component({
  selector: 'fsm-rx-debug-log',
  templateUrl: './fsm-rx-debug-log.component.html',
  styleUrls: ['./fsm-rx-debug-log.component.scss']
})
export class FsmRxDebugLogComponent {
  @Input() public debugLog: SimpleDebugEntry[] = [];
}
