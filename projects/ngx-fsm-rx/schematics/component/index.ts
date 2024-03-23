/*eslint-disable*/
import { strings } from "@angular-devkit/core";
import { FileOperator, MergeStrategy, Rule, SchematicContext, SchematicsException, Tree, apply, applyTemplates, chain, externalSchematic, filter, forEach, mergeWith, move, noop, url } from '@angular-devkit/schematics';
import { NodeDependency, getPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateHtmlSelector } from '@schematics/angular/utility/validation';
import { ProjectDefinition, buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import { spawnSync } from 'child_process';
import { Collection, StatesToHook, getCanAllLeaveTo, getStates, getStatesToHook } from "../shared";
import { GenerateFsmRxComponentSchema } from './component';


export function generateFsmRxComponent(options: GenerateFsmRxComponentSchema): Rule {
    return async (tree: Tree, context: SchematicContext) => {

        //Copied from angular-cli-main component 
        const workspace = await getWorkspace(tree);
        const project: ProjectDefinition | undefined = workspace.projects.get(options.project);

        options.style = options.style === "none" ? Object.entries(project?.extensions?.["schematics"] as object ?? {}).find(([key]) => {
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
        const canLeaveTo: Collection = await getCanAllLeaveTo(fsmStates, context);
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
                    'if-flat': (s: string) => (options.flat ? '' : s),
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

function getDecisionStates(canLeaveTo: Collection): Collection {

    return Object.entries(canLeaveTo).reduce((rData: Collection, [key, value]) => {
        if (value.length > 0) { rData[key] = value; }
        return rData;
    }, {});

}
