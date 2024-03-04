import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FsmRxDebugLogComponent } from './components/fsm-rx-debug-log/fsm-rx-debug-log.component';
import { FsmRxStateDiagramComponent } from './components/fsm-rx-state-diagram/fsm-rx-state-diagram.component';
import { FsmRxDebugSetComponent } from './components/fsm-rx-debug-set/fsm-rx-debug-set.component';

@NgModule({
  declarations: [
    FsmRxDebugLogComponent,
    FsmRxStateDiagramComponent,
    FsmRxDebugSetComponent,
  ],
  imports: [CommonModule],
  exports: [
    FsmRxDebugLogComponent,
    FsmRxStateDiagramComponent,
    FsmRxDebugSetComponent,
  ]
})
export class NgxFsmRxModule { }
