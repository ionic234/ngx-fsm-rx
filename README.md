# NgxFsmRx

## About 

Angular wrapper around [FsmRx](https://github.com/ionic234/fsm-rx), a Finite State Machine built upon RxJS and Typescript.  

## Related projects

* [FsmRx](https://github.com/ionic234/fsm-rx): Core FsmRx package
* [NgxFsmRxExamples](https://github.com/ionic234/ngx-fsm-rx-examples): Storybook Examples of NgFsmRx in use 

## Further Documentation 

For full documentation see:
* [FsmRx Public API Compodoc Documentation](https://ionic234.github.io/fsm-rx/) 
* [NgxFsmRx Public API Compodoc Documentation](https://ionic234.github.io/ngx-fsm-rx/) 
* [Deep-dive articles with Angular Storybook examples](https://ionic234.github.io/ngx-fsm-rx-examples)

## Installation 

```
ng add ngx-fsm-rx
```

## Quick Start Guide - Schematics

### Component 

```
ng generate ngx-fsm-rx:component
```

![Gif showing ng generate schematic for NgxFsmRx components](https://raw.githubusercontent.com/ionic234/ngx-fsm-rx/schematics/ngx-fsm-rx.gif "ng generate schematic for NgxFsmRx components")

### Service

```
ng generate ngx-fsm-rx:service
```

## Quick Start Guide - Manual

### Create FSM states union

```ts
type States = "foo" | "bar" | "baz";
```

### Create FSM state data union

```ts
interface CommonData extends BaseStateData<States> {
    commonProperty: string;
}

interface FooData extends CommonData {
    state: "foo";
    fooProperty: number;
}

interface BarData extends CommonData {
    state: "bar";
    barProperty: string;
}

interface BazData extends CommonData {
    state: "baz";
    bazProperty: boolean;
}

type StateData = FooData | BarData | BazData;
```

### Create CanLeaveToMap

#### As Type
```ts
type CanLeaveToMap = {
    FSMInit: "foo",
    foo: "bar",
    bar: "foo" | "baz";
    baz: "FSMTerminate";
};
```

#### As Interface
```ts
interface CanLeaveToMap extends CanLeaveToStatesMap<States> {
    FSMInit: "foo",
    foo: "bar",
    bar: "foo" | "baz";
    baz: "FSMTerminate";
}
```

### Extend FsmRx and Define StateMap 

#### Component

```ts
@Component({
    selector: 'app-foo-bar-baz-fsm',
    templateUrl: './foo-bar-baz-fsm.component.html',
    standalone: true,
    imports: [CommonModule],
    styleUrls: ['./foo-bar-baz-fsm.component.scss']
})
export class FooBarBazFSM  extends FsmRxComponent<States, StateData, CanLeaveToMap>{
     public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
        foo: {
            canEnterFromStates: { FSMInit: true, bar: true },
            canLeaveToStates: { bar: true }
        },
        bar: {
            canEnterFromStates: { foo: true },
            canLeaveToStates: { foo: true, baz: true }
        },
        baz: {
            canEnterFromStates: { bar: true },
            canLeaveToStates: { FSMTerminate: true }
        }
    };
}
```

#### Service

```ts
@Injectable({
  providedIn: 'root'
})
export class FooBarBazFSM  extends FsmRxInjectable<States, StateData, CanLeaveToMap>{
     public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
        foo: {
            canEnterFromStates: { FSMInit: true, bar: true },
            canLeaveToStates: { bar: true }
        },
        bar: {
            canEnterFromStates: { foo: true },
            canLeaveToStates: { foo: true, baz: true }
        },
        baz: {
            canEnterFromStates: { bar: true },
            canLeaveToStates: { FSMTerminate: true }
        }
    };
}
```

### Define The Constructor and Transition to the First State 
```ts
 public constructor() {
    super();
    this.changeState<"FSMInit">({ state: "foo", commonProperty: "some-string", fooProperty: 5 });     
}
```

### Define onEnter, onLeave and onUpdate callbacks

#### Inline function
```ts 
public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
    foo:{
        ...
        onEnter: (changes:OnEnterStateChanges<States, "foo", StateData, CanLeaveToMap>) => {
            // State buildup logic goes here 
        },
        onLeave: (changes:OnLeaveStateChanges<States, "foo", StateData, CanLeaveToMap>) => {
            // State teardown logic goes here 
        },
        onUpdate: (changes:OnUpdateStateChanges<States, "foo", StateData, CanLeaveToMap>) => {
            // State update logic goes here 
        }
    }
    ...
}
```

#### Regular function

```ts 
public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
    foo:{
        ...
        onEnter: this.handleOnEnterFoo,
        onLeave: this.handleOnLeaveFoo,
        onUpdate: this.handleOnUpdateFoo
    }
    ...
}

private handleOnEnterFoo(changes: OnEnterStateChanges<States, "foo", StateData, CanLeaveToMap>): void {
    // State buildup logic goes here 
}

private handleOnLeaveFoo(changes: OnLeaveStateChanges<States, "foo" , StateData, CanLeaveToMap>): void {
     // State teardown logic goes here 
}

private handleOnUpdateFoo(changes: OnUpdateStateChanges<States, "foo", StateData, CanLeaveToMap>): void {
    // State update logic goes here 
}
```

#### Regular function with multiple states

```ts 
public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
    foo:{
        ...
        onEnter: this.handleOnEnterFooBar,
        onLeave: this.handleOnLeaveFooBar,
        onUpdate: this.handleOnUpdateFooBar
    },
    bar:{
        ...
        onEnter: this.handleOnEnterFooBar,
        onLeave: this.handleOnLeaveFooBar,
        onUpdate: this.handleOnUpdateFooBar
    }
    ...
}

private handleOnEnterFooBar(changes: OnEnterStateChanges<States, "foo" | "bar", StateData, CanLeaveToMap>): void {
    // States buildup logic goes here 
}

private handleOnLeaveFooBar(changes: OnLeaveStateChanges<States, "foo" | "bar", StateData, CanLeaveToMap>): void {
     // States teardown logic goes here 
}

private handleOnUpdateFooBar(changes: OnUpdateStateChanges<States, "foo" | "bar", StateData, CanLeaveToMap>): void {
    // States update logic goes here  
}
```
### Get Current State

```ts
this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<States, StateData, CanLeaveToMap>) => {
    if (currentStateInfo.state === "FSMInit") { return; }
    const currentState: States = currentStateInfo.state;
    switch (currentState) {
        case "foo":
            ...
            break;
        case "bar":
            ...
            break;
        case "baz":
            ...
            break;
        default:
            this.assertCannotReach(currentState);
    }
});
```

### Update State

#### From currentState$
```ts
this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<States, StateData, CanLeaveToMap>) => {
    const { state, stateData } = currentStateInfo;
    if (state === "foo") {
        const { fooProperty } = stateData;
        this.updateState({
            ...stateData,
            fooProperty: fooProperty + 1
        });
    }
});
```
#### From Transition Callback 

```ts
public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
    foo:{
        ...
        onEnter: (changes:OnEnterStateChanges<States, "foo", StateData, CanLeaveToMap>) => {
            const { stateData } = changes.enteringStateInfo;
            const { fooProperty } = stateData;
            this.updateState({
                ...stateData,
                fooProperty: fooProperty + 1
            });
        },
        ...
    }
    ...
}
```

### Change State

#### From currentState$

```ts
this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<States, StateData, CanLeaveToMap>) => {
    const { state, canLeaveTo } = currentStateInfo;
    if (state === "foo" && canLeaveTo.includes("bar")) {
        this.changeState<"foo">({
            state: "bar",
            commonProperty: "some-string",
            barProperty: "some-other-string"
        });
    }
});
```

#### From Transition Callback 

```ts
public override stateMap: StateMap<States, StateData, CanLeaveToMap> = {
    foo:{
        ...
        onEnter: (changes:OnEnterStateChanges<States, "foo", StateData, CanLeaveToMap>) => {
            const { canLeaveTo } = changes.enteringStateInfo;
            if (canLeaveTo.includes("bar")) {
                this.changeState<"foo">({
                    state: "bar",
                    commonProperty: "some-string",
                    barProperty: "some-other-string"
                });
            }
        },
        ...
    }
    ...
}
```

### Unsubscribe Rxjs Helpers

```ts
interval(500).pipe(
    takeUntil(this.nextChangeStateTransition$), // Unsubscribes on the next change state transition 
    takeUntil(this.destroy$) // Unsubscribes on destroy
).subscribe(() => {
    ...
});
```

## Get in contact

### Submit a bug report

Please visit [github/issues](https://github.com/ionic234/ngx-fsm-rx/issues) to submit a bug report or feature request. 

### Community  

For the latest news and community discussions please visit the [github/discussions](https://github.com/ionic234/fsm-rx/discussions) in the core [FsmRx](https://github.com/ionic234/fsm-rx) package. This is done to not split the community. 