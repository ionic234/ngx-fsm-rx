
import { Component, ContentChild, Input, OnDestroy } from '@angular/core';
import { BaseStateData, CanLeaveToStatesMap, DebugLogEntry, TransitionResult } from 'fsm-rx';
import { SimpleDebugEntry } from '../fsm-rx-debug-log/fsm-rx-debug-log.component';
import { Subject, takeUntil } from 'rxjs';
import { FsmRxComponent } from '../../classes/fsm-rx-component/fsm-rx-component';

export type DebugLogResult = "success" | "error" | "warning" | "filtered" | 'override' | 'reset';

@Component({
  selector: 'fsm-rx-debug-set',
  templateUrl: './fsm-rx-debug-set.component.html',
  styleUrls: ['./fsm-rx-debug-set.component.scss']
})
export class FsmRxDebugSetComponent implements OnDestroy {

  public debugLog: SimpleDebugEntry[] | undefined = undefined;
  public stateDiagramDefinition: string | undefined = undefined;

  private destroy$: Subject<void> = new Subject();

  @Input() public debugLogKeys: string[] = ["state"];

  @ContentChild('fsmRxComponent', { static: false }) private set _fsmRxComponent(fsmRxComponent: FsmRxComponent<string, BaseStateData<string>, CanLeaveToStatesMap<string>>) {

    fsmRxComponent?.outputStateDiagramDefinition.pipe(takeUntil(this.destroy$)).subscribe((stateDiagramDefinition: string | undefined) => {
      this.stateDiagramDefinition = stateDiagramDefinition;
    });

    fsmRxComponent?.outputDebugLog.subscribe((debugLog: DebugLogEntry<string, BaseStateData<string>>[] | undefined) => {
      this.debugLog = debugLog ? this.processDebugLog(debugLog) : undefined;
    });

  }

  private processDebugLog(debugLog: DebugLogEntry<string, BaseStateData<string>>[]): SimpleDebugEntry[] {
    return debugLog.reduce((rData: SimpleDebugEntry[], entry: DebugLogEntry<string, BaseStateData<string>>) => {
      rData.push({
        time: this.formatTimestamp(entry.timeStamp),
        type: entry.transitionType,
        data: typeof (entry.stateData) === "string" ? entry.stateData : this.formatStateData(entry.stateData, this.debugLogKeys),
        message: entry.message,
        result: this.getDebugEntryResult(entry.result)
      });
      return rData;
    }, []).reverse();
  }

  private getDebugEntryResult(transitionResult: TransitionResult): DebugLogResult {
    if (transitionResult === "success") { return 'success'; }
    if (transitionResult === "override") { return 'override'; }
    if (transitionResult === "reset") { return "reset"; }
    if (transitionResult === "internal_error" || transitionResult === "unknown_error") { return "error"; }
    if (transitionResult === "repeat_update_filtered") { return "filtered"; }
    return 'warning';
  }

  private formatStateData(
    transitionData: Record<string, unknown>,
    debugLogKeys: string[]): string {

    const pulledData = debugLogKeys.reduce((rData: Record<string, unknown>, key: string) => {
      if (key in transitionData) {
        rData[key] = transitionData[key] ?? null;
      }
      return rData;
    }, {});
    return JSON.stringify(pulledData, null, 1);
  }

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

  public ngOnDestroy(): void {
    this.destroy$.next();
  }

}
