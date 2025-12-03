import { _decorator, Component, Label, CCString } from 'cc';
import {Tools} from './Tools';
import {NumberPlus} from './NumberPlus';

const { ccclass, property, requireComponent } = _decorator;

@ccclass('AddCoinLabel')
@requireComponent(Label)
export default class AddCoinLabel extends Component {
    @property(CCString)
    public preStr: string = '';

    private _valueLabel: Label | null = null;
    private curValue: number = 0;
    private _formatFunc: Function = Tools.formatNumberToInt;
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

    setPreStr(str: string): void {
        this.preStr = str;
    }

    setFormatFunc(func: Function): void {
        this._formatFunc = func;
    }

    setValue(value: number): void {
        value = Math.floor(Number(value));
        this.curValue = value;
        if (this._valueLabel) {
            this._valueLabel.string = this.preStr + this._formatFunc(value);
        }
    }

    update(dt: number): void {
        if (this._running) {
            this._runTime += dt;
            let progress = this._runTime / this._maxTime;
            progress = Math.max(0, Math.min(1, progress));
            const currentValue = NumberPlus.lerp(this._startValue, this._resultValue, progress);
            this.setValue(currentValue);
            
            if (this._runTime >= this._maxTime) {
                this._running = false;
                this.finish();
            }
        }
    }

    finish(): void {
        if (this._playCompleteCallback) {
            const callback = this._playCompleteCallback;
            this._playCompleteCallback = null;
            callback();
        }
        this.node.emit('finished');
    }

    getCurrValue(): number {
        return this.curValue;
    }

    getRunning(): boolean {
        return this._running;
    }

    immediateStop(): void {
        this._running = false;
        this.setValue(this._resultValue);
        this.finish();
    }

    stop(): void {
        this._running = false;
        this.setValue(this._resultValue);
    }

    play(startValue: number, resultValue: number, duration: number, callback?: () => void): void {
        this._playCompleteCallback = callback || null;
        this._startValue = startValue;
        this._resultValue = resultValue;
        this._maxTime = duration;
        this._runTime = 0;
        this._running = true;
    }

    playTo(targetValue: number, duration: number, callback?: () => void): void {
        this._playCompleteCallback = callback || null;
        this._startValue = this.curValue;
        this._resultValue = targetValue;
        this._maxTime = duration;
        this._runTime = 0;
        this._running = true;
    }

    playBy(delta: number, duration: number, callback?: () => void): void {
        if (this._running) {
            if (this._playCompleteCallback) {
                this._playCompleteCallback();
                this.node.emit('finished');
            }
            this._resultValue = NumberPlus.add(this._resultValue, delta);
        } else {
            this._startValue = this.curValue;
            this._resultValue = NumberPlus.add(this.curValue, delta);
        }
        
        this._playCompleteCallback = callback || null;
        this._maxTime = duration;
        this._runTime = 0;
        this._running = true;
    }

    get string(): string {
        return this.curValue.toString();
    }

    set string(value: string) {
        this.setValue(Number(value));
    }
}