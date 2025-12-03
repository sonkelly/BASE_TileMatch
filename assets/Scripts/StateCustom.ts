import { _decorator, cclegacy } from 'cc';
import IState from './IState';

const { ccclass, property } = _decorator;

@ccclass('StateCustom')
export default class StateCustom extends IState {
    private __target: any = null;
    private __enterFunc: Function | null = null;
    private __exitFunc: Function | null = null;
    private __updateFunc: Function | null = null;

    constructor(target: any, enterFunc?: Function, updateFunc?: Function, exitFunc?: Function) {
        super();
        this.__target = target;
        this.__enterFunc = enterFunc || null;
        this.__updateFunc = updateFunc || null;
        this.__exitFunc = exitFunc || null;
    }

    public onEnter(state: any): void {
        this.clearIntervals();
        if (this.__enterFunc && this.__target) {
            this.__enterFunc.call(this.__target, state);
        }
    }

    public onExit(): void {
        if (this.__exitFunc && this.__target) {
            this.__exitFunc.call(this.__target);
        }
    }

    public onUpdate(state: any): void {
        this.invokeIntervals(state);
        if (this.__updateFunc && this.__target) {
            this.__updateFunc.call(this.__target, state);
        }
    }

    public clearIntervals(): void {}
    public invokeIntervals(state: any): void {}
}