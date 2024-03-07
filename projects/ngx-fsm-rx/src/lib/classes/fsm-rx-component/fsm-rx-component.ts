
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output, SimpleChanges, isDevMode } from "@angular/core";
import deepEqual from "deep-equal";
import { BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInit, FSMInitStateData, StateOverride } from "fsm-rx";
import { Subscription, takeUntil } from "rxjs";
import { FsmRxInjectable } from "../fsm-rx-injectable/fsm-rx-injectable";
import { FsmComponentConfig } from "./fsm-rx-component.types";

/**
 * An extension of FsmRx to work with angular components 
 */
@Component({ template: "" })
export abstract class FsmRxComponent<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>> extends FsmRxInjectable<TState, TStateData, TCanLeaveToStatesMap> implements OnDestroy, OnChanges, AfterViewInit {

    /** Input for a partial configuration object which controls the availability of certain debugging features. Can only be used in development.*/
    @Input() public fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>> = {};

    /** Output for the array of DebugLogEntry data which represents the outcome of applying a state transition.*/
    @Output() public outputDebugLog: EventEmitter<DebugLogEntry<TState, TStateData>[] | undefined> = new EventEmitter();

    /** Output for the string instructions to draw a state diagram of the state transitions */
    @Output() public outputStateDiagramDefinition: EventEmitter<string | undefined> = new EventEmitter();

    /** 
     * Override of the configuration object that controls the availability of certain debugging features.
     * This override adds additional options relevant for components. 
     */
    protected override resolvedFsmConfig!: FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>;

    /**
     * Rxjs subscription to stateData$ which is used to emit the stateDiagramDefinition
     */
    private stateDiagramDefinitionSubscription: Subscription | undefined;

    /* istanbul ignore next */
    /** 
     * Constructor for FsmRx. 
     * It calls functions (via the super chain) which create the fsmDebugConfig and construct the observables required for the FSM to function. 
     * @param fsmConfig An optional partial configuration object which controls the availability of certain debugging features.  
     * By default it is set to {}
     * @param isInDevMode An Optional boolean which sets whether the application in running in debug mode or not.
     * By default it is set to the result of calling the angular function isDevMode()  
     * It is not recommended to set this value outside of testing. 
     */
    protected constructor(
        @Inject('fsmConfig') fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>> = {},
        @Inject('isInDevMode') isInDevMode: boolean = isDevMode()
    ) {
        super(fsmConfig, isInDevMode);
    }

    /**
     * An override of the function that constructs the FsmConfig object by combining the supplied fsmConfig partial with default values.  
     * This override adds additional options relevant for components. 
     * @param fsmConfig The partial configuration object supplied by the user.
     * @param isInDevMode A boolean which determines whether the application in running in debug mode or not.
     * @returns A whole FSMConfig object constructed by combining the supplied fsmConfig partial with default values.
     */
    protected override extractFsmConfig(
        fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>>,
        isInDevMode: boolean
    ): FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap> {
        return {
            ...super.extractFsmConfig(fsmConfig, isInDevMode),
            outputStateDiagramDefinition: fsmConfig.outputStateDiagramDefinition ?? (isInDevMode ? true : false),
            outputDebugLog: fsmConfig.outputDebugLog ?? (isInDevMode ? true : false),
        };
    }

    /**
     * Implementation of the AfterViewInit lifecycle hook. 
     * If allowed by the resolvedFsmConfig emits the debugLog and starts the generation of the stateDiagramDefinition
     * This is done in the AfterViewInit hook so all listening components have a chance to instantiate before emission. 
     */
    public ngAfterViewInit(): void {
        if (this.resolvedFsmConfig.outputDebugLog) {
            this.outputDebugLog.emit(this.debugLog);
        }
        if (this.resolvedFsmConfig.outputStateDiagramDefinition) { this.startStateDiagramDefinitionOutput(); }
    }

    /**
     * Create a subscription to stateData$ which emits the stateDiagramDefinition each time the state is changed. 
     */
    private startStateDiagramDefinitionOutput(): void {
        this.stateDiagramDefinitionSubscription = this.stateData$.pipe(takeUntil(this.destroy$)).subscribe((stateData: TStateData | FSMInitStateData) => {
            this.outputStateDiagramDefinition.emit(this.getStateDiagramDefinition(stateData.state));
        });
    }

    /**
     * Unsubscribes from the stateDiagramDefinitionSubscription and clears the stateDiagram definition. 
     */
    private stopStateDiagramDefinitionOutput(): void {
        this.stateDiagramDefinitionSubscription?.unsubscribe();
        this.stateDiagramDefinitionSubscription = undefined;
        this.clearStateDiagramDefinition();
        this.outputStateDiagramDefinition.emit(undefined);
    }

    /**
     * Implementation of the OnChanges lifecycle hook. 
     * Detects and handles changes to the fsmConfig which is important for storybook integration. 
     * @param changes The changes angular has detected. 
     */
    public ngOnChanges(changes: SimpleChanges): void {

        if (changes['fsmConfig']) {

            if (!this.isInDevMode) {
                console.warn("fsmConfig @Input is not supported in production");
                return;
            }

            /* istanbul ignore next */
            if (changes['fsmConfig'].firstChange && Object.keys(changes['fsmConfig'].currentValue).length === 0) { return; }

            const previousConfig: FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap> = this.resolvedFsmConfig;
            this.resolvedFsmConfig = this.extractFsmConfig(
                {
                    ...this.resolvedFsmConfig,
                    ...changes['fsmConfig'].currentValue
                }, this.isInDevMode);
            this.handlePossibleStateOverrideChange(previousConfig.stateOverride, this.resolvedFsmConfig.stateOverride);

            if (previousConfig.outputDebugLog !== this.resolvedFsmConfig.outputDebugLog) {
                this.outputDebugLog.emit(this.resolvedFsmConfig.outputDebugLog ? this.debugLog : undefined);
            }

            if (previousConfig.debugLogBufferCount !== this.resolvedFsmConfig.debugLogBufferCount) {
                this.capDebugLogLength(this.resolvedFsmConfig.debugLogBufferCount);
                if (this.resolvedFsmConfig.outputDebugLog) {
                    this.outputDebugLog.emit(this.debugLog);
                }
            }

            if (previousConfig.outputStateDiagramDefinition !== this.resolvedFsmConfig.outputStateDiagramDefinition) {
                this.resolvedFsmConfig.outputStateDiagramDefinition ? this.startStateDiagramDefinitionOutput() : this.stopStateDiagramDefinitionOutput();
                return;
            }

            if (this.resolvedFsmConfig.outputStateDiagramDefinition && previousConfig.stateDiagramDirection !== this.resolvedFsmConfig.stateDiagramDirection) {
                this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>) => {
                    this.clearStateDiagramDefinition();
                    if (this.resolvedFsmConfig.outputStateDiagramDefinition) {
                        this.outputStateDiagramDefinition.emit(this.getStateDiagramDefinition(currentStateInfo.state as TState | FSMInit));
                    }
                });
            }
        }
    }

    /**
     * Determines if an override value has been given and executes the override if it has
     * @param previousStateOverride The previous value for stateOverride
     * @param newStateOverride The new value for stateOverride. 
     */
    private handlePossibleStateOverrideChange(
        previousStateOverride: StateOverride<TState, TStateData, TCanLeaveToStatesMap> | false,
        newStateOverride: StateOverride<TState, TStateData, TCanLeaveToStatesMap> | false
    ): void {
        if (!newStateOverride) { return; }
        if (!deepEqual(previousStateOverride, newStateOverride, { strict: true })) {
            this.override$.next();
            this.overrideCurrentState(newStateOverride, this.resolvedFsmConfig.resetDebugLogOnOverride);
        }
    }

    /**
     * Override of the function that processes the debug log entry and stores it in the _debugLog.
     * Also makes sure the _debugLog doesn't exceed the debugLogBufferCount specified in the fsmDebugConfig
     * This override emits the debug log when it is written to. 
     * @param entry The debug log entry to store. 
     */
    protected override writeToDebugLog(entry: DebugLogEntry<TState, TStateData>): void {
        super.writeToDebugLog(entry);
        if (this.resolvedFsmConfig.outputDebugLog && this.outputDebugLog) {
            this.outputDebugLog.emit(this.debugLog);
        }
    }

}

