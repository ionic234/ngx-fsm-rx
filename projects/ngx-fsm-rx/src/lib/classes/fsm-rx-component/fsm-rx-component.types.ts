import { BaseStateData, CanLeaveToStatesMap, FsmConfig, BaseFsmConfig } from "fsm-rx";

/**
 * Base Config Options that only apply to FsmRx Components.
 */
type BaseConfig = {
    outputStateDiagramDefinition: boolean,
    outputDebugLog: boolean;
};

/**
 * All base config options that apply to FsmRx classes and Components. 
 * Useful when passing config options through non fsm-rx parents without access to the TState, TStateData, TCanLeaveToStatesMap types required for stateOverride. 
 */
export type BaseFsmComponentConfig = BaseFsmConfig & BaseConfig;

/**
 * A configuration object that controls the availability of certain debugging features for FsmRxComponents.
 * @template TState String union of the custom states of the finite state machine.
 * @template TStateData The data associated with each state.
 * @template TCanLeaveToStatesMap A map specifying the states a given state can leave to.
 */
export type FsmComponentConfig<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> = FsmConfig<TState, TStateData, TCanLeaveToStatesMap> & BaseConfig;
