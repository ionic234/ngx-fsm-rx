export interface GenerateFsmRxComponentSchema {
    path: string;
    project: string;
    name: string,
    prefix: string,
    selector: string;
    style: string;
    module: string;
    standalone: boolean;
    flat: boolean;
}