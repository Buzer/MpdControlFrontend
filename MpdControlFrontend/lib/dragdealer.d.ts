declare class Dragdealer {
    options: DragdealerOptions;
    constructor(wrapper: string);
    constructor(wrapper: string, options: DragdealerOptions);
    disable();
    enable();
    reflow();
    getValue();
    getStep();
    setValue(x:number, y:number, snap:boolean);
    setStep(x:number, y:number, snap:boolean)
}
interface DragdealerOptions {
    disabled: boolean;
    horizontal: boolean;
    vertical: boolean;
    slide: boolean;
    steps: number;
    snap: boolean;
    loose: boolean;
    speed: number;
    xPrecision: number;
    yPrecision: number;
    handleClass: string;
    css3: boolean;
    callback: (x: number, y: number) => any;
    animationCallback: (x: number, y: number) => any;
}