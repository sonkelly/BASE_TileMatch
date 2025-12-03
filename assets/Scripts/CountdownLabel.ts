import { _decorator, Component, Label, CCString, math, cclegacy } from 'cc';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
const { ccclass, property } = _decorator;

@ccclass('CountdownLabel')
export class CountdownLabel extends Component {
    @property(CCString)
    preStr: string = '';

    private _valueLabel: Label | null = null;
    private _curValue: number = 0;
    private _running: boolean = false;
    private _runTime: number = 0;
    private _maxTime: number = 0;
    private _startValue: number = 0;
    private _resultValue: number = 0;
    private _playCompleteCallback: (() => void) | null = null;

    onLoad() {
        this._valueLabel = this.node.getComponent(Label);
    }

    getLabel(): Label | null {
        return this._valueLabel;
    }

    setPreStr(str: string) {
        this.preStr = str;
    }

    setValue(value: number) {
        this._curValue = value;
        if (this._valueLabel) {
            this._valueLabel.string = this.preStr + moment.utc(1000 * this._curValue).format('mm:ss');
        }
    }

    update(dt: number) {
        if (this._running) {
            this._runTime += dt;
            let progress = this._runTime / this._maxTime;
            progress = Math.max(0, Math.min(1, progress));
            const currentValue = math.lerp(this._startValue, this._resultValue, progress);
            this.setValue(currentValue);
            
            if (this._runTime >= this._maxTime) {
                this._running = false;
                this.finish();
            }
        }
    }

    finish() {
        if (this._playCompleteCallback) {
            const callback = this._playCompleteCallback;
            this._playCompleteCallback = null;
            callback();
        }
    }

    getCurrValue(): number {
        return this._curValue;
    }

    getRunning(): boolean {
        return this._running;
    }

    immediateStop() {
        this._running = false;
        this.setValue(this._resultValue);
        this.finish();
    }

    play(startValue: number, resultValue: number, duration: number, completeCallback?: () => void) {
        this._playCompleteCallback = completeCallback || null;
        this._startValue = startValue;
        this._resultValue = resultValue;
        this._maxTime = duration;
        this._runTime = 0;
        this._running = true;
    }
}