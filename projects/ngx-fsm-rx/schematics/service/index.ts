/*eslint-disable*/
import { strings } from "@angular-devkit/core";
import { FileOperator, MergeStrategy, Rule, SchematicContext, SchematicsException, Tree, apply, applyTemplates, chain, externalSchematic, forEach, mergeWith, move, url } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { ProjectDefinition, buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import { Collection, StatesToHook, getCanAllLeaveTo, getStates, getStatesToHook } from '../shared';
import { GenerateFsmRxServiceSchema } from './service';

export function generateFsmRxService(options: GenerateFsmRxServiceSchema): Rule {
    return async (tree: Tree, context: SchematicContext) => {

        const fsmStates: string[] = await getStates(context);
        const canLeaveTo: Collection = await getCanAllLeaveTo(fsmStates, context);
        const statesToHook: StatesToHook = await getStatesToHook(fsmStates);

        const workspace = await getWorkspace(tree);
        const project: ProjectDefinition | undefined = workspace.projects.get(options.project);

        if (!project) { throw new SchematicsException(`Project "${options.project}" does not exist.`); }
        if (options.path === undefined) { options.path = buildDefaultPath(project); }

        const parsedPath = parseName(options.path, options.name);

        const templateSource = apply(
            url('./files'),
            [
                applyTemplates({
                    ...strings,
                    ...options,
                    'if-flat': (s: string) => (options.flat ? '' : s),
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
            externalSchematic("@schematics/angular", "service", options),
            mergeWith(templateSource, MergeStrategy.Overwrite)
        ]);
    };
}