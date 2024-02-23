import { Injectable, OnDestroy, isDevMode } from "@angular/core";
import { FsmRx, BaseStateData, CanLeaveToStatesMap, FsmConfig } from "fsm-rx";

/**
 * An extension of FsmRx to work with angular injectable 
 */
@Injectable()
export abstract class FsmRxInjectable<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>> extends FsmRx<TState, TStateData, TCanLeaveToStatesMap> implements OnDestroy {

    /* istanbul ignore next */
    /**
     * Constructor for FsmRxInjectable.<br> 
     * It calls functions (via the super chain) which create the fsmDebugConfig and construct the observables required for the FSM to function. 
     * @param fsmConfig An optional partial configuration object which controls the availability of certain debugging features. <br> 
     * By default it is set to {}
     * @param isInDevMode An Optional boolean which sets whether the application in running in debug mode or not.<br>
     * By default it is set to the result of calling the angular function isDevMode() <br> 
     * It is not recommended to set this value outside of testing. 
     */
    protected constructor(
        fsmConfig: Partial<FsmConfig<TState, TStateData, TCanLeaveToStatesMap>> = {},
        isInDevMode: boolean = isDevMode()
    ) {
        super(fsmConfig, isInDevMode);
    }

    /* istanbul ignore next */
    /**
     * Implementation of the OnDestroy lifecycle hook.<br>
     * Calls destroy to complete and unsubscribes from the FSMs observables and behavior subjects.
     * Not all injectable types will automatically call ngOnDestroy so this function may require manual triggering. 
     */
    public ngOnDestroy(): void {
        this.destroy();
    }
}

