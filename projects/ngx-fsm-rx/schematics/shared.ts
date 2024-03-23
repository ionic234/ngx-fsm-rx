/*eslint-disable*/
import { strings } from "@angular-devkit/core";
import { SchematicContext } from '@angular-devkit/schematics';
import { StateLifecycleHook } from "fsm-rx";
import prompts from 'prompts';

export type Collection = {
    [key: string]: string[];
};

export type StateChoice = {
    title: string;
    value: string;
    selected: boolean;
};

export type StatesToHook = Record<StateLifecycleHook, string[]>;

export async function getStates(context: SchematicContext): Promise<string[]> {
    let fsmStates: string[] = [];
    let statesAreAcceptable: boolean = false;
    do {
        fsmStates = await requestStates(context);
        statesAreAcceptable = await areStateAcceptable(fsmStates);

    } while (!statesAreAcceptable);
    return fsmStates;
}

async function requestStates(context: SchematicContext): Promise<string[]> {
    let states: string[] = [];
    do {
        const rawStates = await promptForStates();
        if (rawStates && rawStates !== "") {
            states = await validateStates(rawStates.split(" "), context);
            states = Array.from(new Set(states));
        }
    } while (testStateLength(states, context));

    return states;
}

function testStateLength(states: string[], context: SchematicContext): boolean {
    if (states.length <= 1) {
        context.logger.warn("You must specify two or more states");
        return true;
    }
    return false;
}

async function promptForStates(): Promise<string> {
    const promptAnswer = await prompts([
        {
            type: "text",
            name: "states",
            message: "Input the name of your FSMs states e.g. state1 state2 state3",

        }
    ], { onCancel });
    return promptAnswer.states;
}

async function validateStates(rawStatesArray: string[], context: SchematicContext): Promise<string[]> {
    // Do this the old fashioned way so invalid states are handled one at a time 
    const result: string[] = [];
    for (let i = 0; i < rawStatesArray.length; i++) {
        let validatedStateName: string = await validateStateName(rawStatesArray[i], context);
        if (validatedStateName !== "") {
            result.push(validatedStateName);
        }
    }
    return result;
}

async function validateStateName(rawStateName: string, context: SchematicContext): Promise<string> {
    rawStateName = rawStateName.trim();
    while (!isValidStateName(rawStateName, context)) {
        rawStateName = await promptToFixStateName(rawStateName);
    }
    return rawStateName;
}

function isValidStateName(input: string, context: SchematicContext): boolean {

    if (input === "") { return true; }

    const isAlphaNumeric: boolean = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(input);
    if (!isAlphaNumeric) {
        context.logger.error(`States must be alphanumeric and start with a letter: "${input}" is invalid.`);
        return false;
    }
    if (input.toLowerCase() === "FSMInit".toLowerCase()) {
        context.logger.error(`State "FSMInit" is a reserved state and cannot be used.`);
        return false;
    }
    if (input.toLowerCase() === "FSMTerminate".toLowerCase()) {
        context.logger.error(`State "FSMTerminate" is a reserved state and cannot be used.`);
        return false;
    }

    return true;
}

async function promptToFixStateName(invalidState: string): Promise<string> {
    const promptAnswer = await prompts([
        {
            type: "text",
            name: "state",
            message: `Enter a state to replace "${invalidState}" or leave blank to skip.`
        }
    ]);
    let rawStateName = promptAnswer.state;
    rawStateName = rawStateName.trim();
    rawStateName = strings.classify(rawStateName);
    return rawStateName;
}

async function areStateAcceptable(fsmStates: string[]): Promise<boolean> {
    const promptAnswer = await prompts([
        {
            type: 'confirm',
            name: 'value',
            message: `Do you wish continue with the found states "${fsmStates.join(" ")}"`,
            initial: true
        }
    ], { onCancel });

    return promptAnswer.value;
}

export async function getCanAllLeaveTo(fsmStates: string[], context: SchematicContext): Promise<Collection> {

    const loopStates: string[] = ["FSMInit", ...fsmStates];
    const canAllLeaveTo: Collection = {};

    for (let i = 0; i < loopStates.length; i++) {
        let state = loopStates[i];
        let canLeaveTo = await promptForCanLeaveTo(state, fsmStates);
        canAllLeaveTo[state] = canLeaveTo;
    }

    return await validateForOrphans(canAllLeaveTo, fsmStates, context);
}

async function promptForCanLeaveTo(state: string, fsmStates: string[]): Promise<string[]> {

    const filteredStates: string[] = fsmStates.filter((x) => { return x !== state; });
    const fsmStatePool = state === "FSMInit" ? filteredStates : [...filteredStates, "FSMTerminate"];

    const choices: StateChoice[] = fsmStatePool.reduce((rData: StateChoice[], x: string) => {
        rData.push({ title: x, value: x, selected: false });
        return rData;
    }, []);

    const promptAnswer = await prompts([
        {
            type: 'multiselect',
            name: 'canLeaveTo',
            message: state === "FSMInit"
                ? "What is the initial state(s) of the FSM?"
                : `What states can "${state}" leave to?`,
            choices: choices,
            instructions: false
        }
    ], { onCancel });

    const canLeaveTo: string[] = promptAnswer.canLeaveTo;
    if (canLeaveTo.length > 0) {
        return canLeaveTo;
    }
    return filteredStates;

}

async function validateForOrphans(canAllLeaveTo: Collection, fsmStates: string[], context: SchematicContext): Promise<Collection> {

    const allLeaveToStates: string[] = ([] as string[]).concat(...Object.values(canAllLeaveTo));
    let canEnterFrom: string[] = [];
    let state: string = "";

    for (let i = 0; i < fsmStates.length; i++) {
        state = fsmStates[i];
        if (!allLeaveToStates.includes(state)) {

            do {
                context.logger.warn(`No states leave to the ${state} state.`);
                canEnterFrom = await promptForStatesCanEnterFrom(state, fsmStates);
            } while (canEnterFrom.length === 0);

            canEnterFrom.forEach((enterFromState: string) => { canAllLeaveTo[enterFromState].push(state); });
            canEnterFrom = [];
        }
    }

    return canAllLeaveTo;
}

async function promptForStatesCanEnterFrom(state: string, fsmStates: string[]): Promise<string[]> {

    const filteredStates: string[] = fsmStates.filter((x) => { return x !== state; });
    const fsmStatePool = [...filteredStates, "FSMInit"];

    const choices: StateChoice[] = fsmStatePool.reduce((rData: StateChoice[], x: string) => {
        rData.push({ title: x, value: x, selected: false });
        return rData;
    }, []);

    const promptAnswer = await prompts([
        {
            type: 'multiselect',
            name: 'canEnterFrom',
            message: `Which states should leave to the ${state} state?`,
            choices: choices,
            instructions: false,
            validate: (value) => { return value.length === 0 ? 'Please select at least one state.' : true; }
        }
    ], { onCancel });

    return promptAnswer.canEnterFrom;
}


export async function getStatesToHook(fsmStates: string[]): Promise<StatesToHook> {

    const onEnter = await getStatesToHookArray("onEnter", fsmStates);
    const onLeave = await getStatesToHookArray("onLeave", fsmStates);
    const onUpdate = await getStatesToHookArray("onUpdate", fsmStates);

    return {
        onEnter,
        onLeave,
        onUpdate,
    };
};

async function getStatesToHookArray(stateLifecycleHook: StateLifecycleHook, fsmStates: string[]): Promise<string[]> {

    const choices: StateChoice[] = fsmStates.reduce((rData: StateChoice[], x: string) => {
        rData.push({ title: x, value: x, selected: false });
        return rData;
    }, []);

    const promptAnswer = await prompts([
        {
            type: 'multiselect',
            name: 'statesToHook',
            message: `Which states require an "${stateLifecycleHook}" lifecycle hook callback`,
            choices: choices,
            instructions: false
        }
    ], { onCancel });

    return promptAnswer.statesToHook;
}

export function onCancel() {
    process.exit(1);
}