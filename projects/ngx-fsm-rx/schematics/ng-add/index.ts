/*eslint-disable*/

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency, getPackageJsonDependency } from '@schematics/angular/utility/dependencies';

export function ngAdd(): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const dependencies: NodeDependency[] = [
            { type: NodeDependencyType.Dev, name: 'mermaid', version: '^10.4.0' },
            { type: NodeDependencyType.Default, name: 'deep-equal', version: '^2.2.3' },
            { type: NodeDependencyType.Default, name: 'fsm-rx', version: '1.0.0-alpha.1' }
        ];

        dependencies.forEach(dependency => {
            try {
                const existingDependency = getPackageJsonDependency(tree, dependency.name);
                if (existingDependency && existingDependency.version !== dependency.version) {
                    _context.logger.warn(`${dependency.name} already exists in package.json with a different version. Skipping.`);
                } else {
                    addPackageJsonDependency(tree, dependency);
                }
            } catch (e) {
                _context.logger.error(`Failed to add ${dependency.name} to package.json: ${(<Error>e).message}`);
            }
        });

        return tree;
    };
}