/*eslint-disable*/
import { strings } from "@angular-devkit/core";
import { FileOperator, MergeStrategy, Rule, SchematicContext, SchematicsException, Tree, apply, applyTemplates, chain, externalSchematic, filter, forEach, mergeWith, move, noop, url } from '@angular-devkit/schematics';
import { NodeDependency, getPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateHtmlSelector } from '@schematics/angular/utility/validation';
import { ProjectDefinition, buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import { spawnSync } from 'child_process';
import { StateLifecycleHook } from "fsm-rx";
import prompts from 'prompts';
import { GenerateFsmRxComponentSchema } from './component';


type Collection = {
    [key: string]: string[];
};

type StateChoice = {
    title: string;
    value: string;
    selected: boolean;
};

type StatesToHook = Record<StateLifecycleHook, string[]>;

export function generateFsmRxComponent(options: GenerateFsmRxComponentSchema): Rule {
    return async (tree: Tree, context: SchematicContext) => {

        //Copied from angular-cli-main component 
        const workspace = await getWorkspace(tree);
        const project: ProjectDefinition | undefined = workspace.projects.get(options.project);

        options.style = "none" ? Object.entries(project?.extensions?.["schematics"] as object ?? {}).find(([key]) => {
            return key === "@schematics/angular:component";
        })?.[1]?.['style'] ?? "less" : options.style;

        if (!project) { throw new SchematicsException(`Project "${options.project}" does not exist.`); }
        if (options.path === undefined) { options.path = buildDefaultPath(project); }

        const parsedPath = parseName(options.path, options.name);

        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector = options.selector || buildSelector(options, (project && project.prefix) || '');

        validateHtmlSelector(options.selector);

        const fsmStates: string[] = await getStates(context);
        const canLeaveTo: Collection = await getCanAllLeaveTo(fsmStates);
        const statesToHook: StatesToHook = await getStatesToHook(fsmStates);

        const storybookDependency: NodeDependency | null = getPackageJsonDependency(tree, "storybook");
        if (storybookDependency) {
            const deepControlsDependency: NodeDependency | null = getPackageJsonDependency(tree, "storybook-addon-deep-controls");
            if (!deepControlsDependency) {
                try {
                    spawnSync('npx', [`storybook@${storybookDependency.version}`, 'add storybook-addon-deep-controls'], { stdio: 'inherit', shell: true });
                } catch (error) {
                    console.error('npx is not available. Please make sure npx is installed on your system.');
                    process.exit(1);
                }
            }
        }

        const templateSource = apply(
            url('./files'),
            [
                !storybookDependency ? filter((path) => !path.endsWith('.stories.ts.template')) : noop(),
                applyTemplates({
                    ...strings,
                    ...options,
                    decisionStates: getDecisionStates(canLeaveTo),
                    fsmStates,
                    canLeaveTo,
                    statesToHook
                }),
                forEach(((file) => {
                    return file.path.includes('..')
                        ? {
                            content: file.content,
                            path: file.path.replace('..', '.'),
                        }
                        : file;
                }) as FileOperator),
                move(parsedPath.path),
            ]
        );

        return chain([
            externalSchematic("@schematics/angular", "component", options),
            mergeWith(templateSource, MergeStrategy.Overwrite)
        ]);
    };
}

function buildSelector(options: GenerateFsmRxComponentSchema, projectPrefix: string) {
    let selector = strings.dasherize(options.name);
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    } else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }

    return selector;
}

async function getStates(context: SchematicContext): Promise<string[]> {
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

async function getCanAllLeaveTo(fsmStates: string[]): Promise<Collection> {

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

async function getStatesToHook(fsmStates: string[]): Promise<StatesToHook> {

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

function getDecisionStates(canLeaveTo: Collection): Collection {

    return Object.entries(canLeaveTo).reduce((rData: Collection, [key, value]) => {
        if (value.length > 0) { rData[key] = value; }
        return rData;
    }, {});

}
