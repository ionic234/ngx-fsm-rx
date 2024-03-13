import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function generateFsm(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const name = options.name;
    console.log("hello", name);
    tree.create("hello.js", `console.log(hi ${name}")`);
    return tree;
  };
}
