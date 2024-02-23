import { BaseStateData, CanLeaveToStatesMap, FsmConfig, BaseFsmConfig } from "fsm-rx";

type BaseConfig = {
    outputStateDiagramDefinition: boolean,
    outputDebugLog: boolean;
};

export type BaseFsmComponentConfig = BaseFsmConfig & BaseConfig;

export type FsmComponentConfig<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> = FsmConfig<TState, TStateData, TCanLeaveToStatesMap> & BaseConfig;
