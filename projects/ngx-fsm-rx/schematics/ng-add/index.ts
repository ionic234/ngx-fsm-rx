/*eslint-disable*/
import { Rule, SchematicContext, Tree, chain, } from '@angular-devkit/schematics';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency, getPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { spawn, spawnSync } from 'child_process';
import prompts from 'prompts';
import { onCancel } from '../shared';


export function ngAdd(): Rule {

    return async (tree: Tree, context: SchematicContext) => {

        const storybookDependency: NodeDependency | null = getPackageJsonDependency(tree, "storybook");
        if (!storybookDependency) {
            const promptAnswer = await prompts([
                {
                    type: "confirm",
                    name: "installStorybook",
                    message: "Do you want to add Storybook as a testing playground? This will run storybook."
                }
            ], { onCancel });
            if (promptAnswer.installStorybook === true) {
                try {
                    spawn('npx', ['storybook@latest', 'init'], { stdio: 'inherit', shell: true });
                } catch (error) {
                    context.logger.error('npx is not available. Please make sure npx is installed on your system.');
                    process.exit(1);
                }
            }
        } else {
            const deepControlsDependency: NodeDependency | null = getPackageJsonDependency(tree, "storybook-addon-deep-controls");
            if (!deepControlsDependency) {
                try {
                    spawnSync('npx', [`storybook@${storybookDependency.version}`, 'add storybook-addon-deep-controls'], { stdio: 'inherit', shell: true });
                } catch (error) {
                    context.logger.error('npx is not available. Please make sure npx is installed on your system.');
                    process.exit(1);
                }
            }
        }

        addDependencies(tree, context);

        return chain([]);
    };
}

function addDependencies(tree: Tree, context: SchematicContext) {
    const dependencies: NodeDependency[] = [
        { type: NodeDependencyType.Dev, name: 'mermaid', version: '^10.4.0' },
        { type: NodeDependencyType.Dev, name: 'prompts', version: '^2.4.2' },
        { type: NodeDependencyType.Dev, name: '@types/dompurify', version: '^3.0.5' },
        { type: NodeDependencyType.Dev, name: '@types/d3', version: '^7.4.3' },
        { type: NodeDependencyType.Default, name: 'deep-equal', version: '^2.2.3' },
        { type: NodeDependencyType.Default, name: 'fsm-rx', version: '1.0.0-alpha.1' }
    ];

    dependencies.forEach(dependency => {
        try {
            const existingDependency = getPackageJsonDependency(tree, dependency.name);
            if (existingDependency && existingDependency.version !== dependency.version) {
                context.logger.warn(`${dependency.name} already exists in package.json with a different version. Skipping.`);
            } else {
                addPackageJsonDependency(tree, dependency);
            }
        } catch (e) {
            context.logger.error(`Failed to add ${dependency.name} to package.json: ${(<Error>e).message}`);
        }
    });

}
