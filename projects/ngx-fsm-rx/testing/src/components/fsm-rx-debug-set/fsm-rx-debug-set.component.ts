import { Component, ContentChild, Input, OnDestroy } from '@angular/core';
import { BaseStateData, CanLeaveToStatesMap, DebugLogEntry, TransitionResult } from 'fsm-rx';
import { Subject, takeUntil } from 'rxjs';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { DebugEntryResult, SimpleDebugEntry } from '../fsm-rx-debug-log/fsm-rx-debug-log.component';

/**
 * An Angular Component that wraps around an FsmRxComponent. 
 * It contains an FsmRxStateDiagramComponent and FsmRxDebugLogComponent which are useful for debugging in playground/testing environments such as Storybook. 
 */
@Component({
  selector: 'fsm-rx-debug-set',
  templateUrl: './fsm-rx-debug-set.component.html',
  styleUrls: ['./fsm-rx-debug-set.component.scss']
})
export class FsmRxDebugSetComponent implements OnDestroy {

  /** An array of SimpleDebugEntry data passed to the FsmRxDebugLogComponent to display in the debug log table */
  public debugLog: SimpleDebugEntry[] | undefined = undefined;
  /** The string instructions passed to the FsmRxStateDiagramComponent and used by mermaid to create the diagram SVG. */
  public stateDiagramDefinition: string | undefined = undefined;
  /** A subject used to trigger the completion of observables when the class is destroyed.*/
  private destroy$: Subject<void> = new Subject();
  /** An array of state data properties to be shown in the "Transition Data" column of the debug log */
  @Input() public debugLogKeys: string[] = ["state"];

  /**
   * A setter for _fsmRxComponent that executes when a child containing a #fsmRxComponent reference is found. 
   * It automatically subscribes to the FsmRxComponents stateDiagramDefinition and debugLog event emitters.
   */
  @ContentChild('fsmRxComponent', { static: false }) private set _fsmRxComponent(fsmRxComponent: FsmRxComponent<string, BaseStateData<string>, CanLeaveToStatesMap<string>>) {

    if (!fsmRxComponent || fsmRxComponent.outputStateDiagramDefinition === undefined || fsmRxComponent.outputDebugLog === undefined) {
      console.error("A Content Child that extends FsmRxComponent must be supplied with a #fsmRxComponent template reference.");
      return;
    }

    fsmRxComponent.outputStateDiagramDefinition.pipe(takeUntil(this.destroy$)).subscribe((stateDiagramDefinition: string | undefined) => {
      this.stateDiagramDefinition = stateDiagramDefinition;
    });

    fsmRxComponent.outputDebugLog.subscribe((debugLog: DebugLogEntry<string, BaseStateData<string>>[] | undefined) => {
      this.debugLog = debugLog ? this.processDebugLog(debugLog) : undefined;
    });

  }

  /**
   * Processes the debugLog of the target FsmRxComponent into the SimpleDebugEntry format for rendering in a FsmRxDebugLogComponent.
   * @param debugLog The debugLog of the target FsmRxComponent.
   * @returns An array containing the simpleDebugEntries for rendering in a FsmRxDebugLogComponent
   */
  private processDebugLog(debugLog: DebugLogEntry<string, BaseStateData<string>>[]): SimpleDebugEntry[] {
    return debugLog.reduce((rData: SimpleDebugEntry[], entry: DebugLogEntry<string, BaseStateData<string>>) => {
      rData.push({
        time: this.formatTimestamp(entry.timeStamp),
        type: entry.transitionType,
        data: typeof (entry.stateData) === "string" ? entry.stateData : this.formatEntryStateData(entry.stateData, this.debugLogKeys),
        message: entry.message,
        result: this.getDebugEntryResult(entry.result)
      });
      return rData;
    }, []).reverse();
  }

  /**
   * Transforms the supplied TransitionResult into the simplified DebugEntryResult.
   * @param transitionResult The transitionResult of a DebugLogEntry
   * @returns A DebugEntryResult
   */
  private getDebugEntryResult(transitionResult: TransitionResult): DebugEntryResult {
    switch (transitionResult) {
      case "success":
        return "success";
      case "override":
        return "override";
      case "reset":
        return 'reset';
      case "internal_error":
        return 'error';
      case "unknown_error":
        return "error";
      default:
        return 'warning';
    }
  }

  /**
   * Transforms the stateData into a string containing only the items specified in debugLogKeys. 
   * @param stateData The data to be processed.
   * @param debugLogKeys An array of keys to include in the returned string. 
   * @returns A string representation of the StateData containing only the keys specified in debugLogKeys. 
   */
  private formatEntryStateData(
    stateData: Record<string, unknown>,
    debugLogKeys: string[]): string {

    const pulledData = debugLogKeys.reduce((rData: Record<string, unknown>, key: string) => {
      if (key in stateData) {
        rData[key] = stateData[key];
      }
      return rData;
    }, {});
    return JSON.stringify(pulledData, null, 1);
  }

  /**
   * Formats the supplied timestamp as HH:MM:SS:MMM AM/PM 
   * @param timeStamp The timestamp to format.
   * @returns A string representation off the timestamp in HH:MM:SS:MMM AM/PM format. 
   */
  private formatTimestamp(timeStamp: number): string {
    const date = new Date(timeStamp);
    const formatter = new Intl.DateTimeFormat('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
    return formatter.format(date);
  }

  /**
   * Implementation of the OnDestroy lifecycle hook.<br>
   * Calls destroy to complete and unsubscribes from the FSMs observables and behavior subjects.
   */
  public ngOnDestroy(): void {
    this.destroy$.next();
  }

}
