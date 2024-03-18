/*eslint-disable*/
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency, getPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { spawn } from 'child_process';

export function ngAdd(): Rule {

    return (tree: Tree, context: SchematicContext) => {

        addDependencies(tree, context);

        const storybookDependency: NodeDependency | null = getPackageJsonDependency(tree, "storybook");
        if (storybookDependency) {
            try {
                spawn('npx', [`storybook@${storybookDependency.version}`, 'add storybook-addon-deep-controls'], { stdio: 'inherit', shell: true });
            } catch (error) {
                console.error('npx is not available. Please make sure npx is installed on your system.');
                process.exit(1);
            }
        }
        return tree;

    };
}

function addDependencies(tree: Tree, context: SchematicContext) {
    const dependencies: NodeDependency[] = [
        { type: NodeDependencyType.Dev, name: 'mermaid', version: '^10.4.0' },
        { type: NodeDependencyType.Dev, name: 'prompts', version: '^2.4.2' },
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
