/*eslint-disable*/
import { normalize, strings } from "@angular-devkit/core";
import { MergeStrategy, Rule, SchematicContext, Tree, apply, applyTemplates, chain, mergeWith, move, url } from '@angular-devkit/schematics';
import { GenerateFsmRxComponentSchema } from './generate-fsm-rx-component';

export function generateFsmRxComponent(options: GenerateFsmRxComponentSchema): Rule {
    return (_tree: Tree, _context: SchematicContext) => {

        debugger;

        if (options.path === undefined) {
            options.path = "src";
        }

        const templateSource = apply(
            url('./files'),
            [
                applyTemplates({
                    classify: strings.classify,
                    dasherize: strings.dasherize,
                    name: options.name,
                    type: options.type,
                }),
                move(normalize(`/${options.path}/${strings.dasherize(options.name)}`))
            ]
        );
        console.log(templateSource.toString());

        return chain([
            mergeWith(templateSource, MergeStrategy.Overwrite)
        ]);
    };
}

/*
import { Component, OnChanges, OnInit } from "@angular/core";
import type { BaseStateData, OnEnterStateChanges, StateMap } from "fsm-rx";
import { FsmRxComponent } from "ngx-fsm-rx";

@Component({
    selector: 'lib-<%dasherize(name)%>',
    templateUrl: './<%dasherize(name)%>.component.html',
    styleUrls: ['./<%dasherize(name)%>.component.scss']
})
export class <%classify(name)%>Component extends FsmRxComponent implements AfterViewInit, OnChanges {

    public constructor() {
        super();
    }

    public override ngAfterViewInit(): void {
        super.ngAfterViewInit();
        if (!this.fsmConfig.stateOverride) {
            this.changeState({ state: "go", stateTimeoutId: undefined, trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } });
        }
    }
}
*/