export interface GenerateFsmRxComponentSchema {
    path: string;
    project: string;
    name: string,
    displayBlock: boolean,
    inlineStyle: boolean,
    standalone: boolean,
    viewEncapsulation: string,
    changeDetection: string,
    prefix: string,
    style: string,
    type: string,
    skipTests: boolean,
    flat: boolean,
    skipImport: boolean,
    selector: string,
    skipSelector: boolean,
    module: string,
    export: boolean;
}