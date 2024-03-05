import { Component, Input } from '@angular/core';
import { TransitionTypes } from 'fsm-rx';

/**
 * The type of the debug entry. 
 * Each string in the union represents a style class to apply to the table row.  
 */
export type DebugEntryResult = "success" | "error" | "warning" | "filtered" | 'override' | 'reset';

/**
 * A simplified representation of a data entry in an FsmRxComponents debugLog.
 * Used to populate a table row. 
 */
export type SimpleDebugEntry = {
  time: string,
  type: TransitionTypes,
  data: string,
  message: string,
  result: DebugEntryResult;
};

/**
 * Angular component that renders a table to display the contents of an FsmRxComponents debugLog.
 * Is usually a child of an FsmRxDebugSetComponent.
 */
@Component({
  selector: 'fsm-rx-debug-log',
  templateUrl: './fsm-rx-debug-log.component.html',
  styleUrls: ['./fsm-rx-debug-log.component.scss']
})
export class FsmRxDebugLogComponent {
  @Input() public debugLog: SimpleDebugEntry[] = [];
}
