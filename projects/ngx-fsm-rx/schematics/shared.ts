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
    } while (states.length === 0);

    return states;
}

async function promptForStates(): Promise<string> {
    const promptAnswer = await prompts([
        {
            type: "text",
            name: "states",
            message: "Input the name of your FSMs states e.g. state1 state2 state3"
        }
    ]);
    return promptAnswer.states;
}

async function validateStates(rawStatesArray: string[], context: SchematicContext): Promise<string[]> {
    // Do this the old fashioned way so invalid states are handled one at a time 
    let result: string[] = [];
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

    let isAlphaNumeric: boolean = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(input);
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
    ]);

    return promptAnswer.value;
}

export async function getCanAllLeaveTo(fsmStates: string[]): Promise<Collection> {

    let loopStates: string[] = ["FSMInit", ...fsmStates];
    const canAllLeaveTo: Collection = {};

    for (let i = 0; i < loopStates.length; i++) {
        let state = loopStates[i];
        let canLeaveTo = await promptForCanLeaveTo(state, fsmStates);
        canAllLeaveTo[state] = canLeaveTo;
    }
    return canAllLeaveTo;
}

async function promptForCanLeaveTo(state: string, fsmStates: string[]): Promise<string[]> {

    let filteredStates: string[] = fsmStates.filter((x) => { return x !== state; });
    let fsmStatePool = state === "FSMInit" ? filteredStates : [...filteredStates, "FSMTerminate"];

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
    ]);

    let canLeaveTo: string[] = promptAnswer.canLeaveTo;
    if (canLeaveTo.length > 0) {
        return canLeaveTo;
    }
    return filteredStates;

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
    ]);

    return promptAnswer.statesToHook;
}
