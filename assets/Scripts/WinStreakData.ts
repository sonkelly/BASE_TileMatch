import { _decorator, cclegacy } from 'cc';
import {IDataObject} from './IDataObject';
import {includes, get, set} from 'lodash-es';
import {Tools} from './Tools';

const { ccclass, property } = _decorator;

@ccclass('WinStreakData')
export class WinStreakData extends IDataObject {
    private _time: number = 0;
    private _maxTime: number = 0;
    private _curTime: number = 0;
    private _tip: boolean = false;
    private _earnList: any[] = [];

    constructor(...args: any[]) {
        super(...args);
        this._time = 0;
        this._maxTime = 0;
        this._curTime = 0;
        this._tip = false;
        this._earnList = [];
    }

    public earnStreak(item: any): void {
        this._earnList.push(item);
        this.doDrity();
    }

    public getIsEarn(item: any): boolean {
        return includes(this._earnList, item);
    }

    public resetData(time: number): void {
        this._time = time;
        this._earnList = [];
        this._curTime = 0;
        this._maxTime = 0;
        this._tip = true;
        this.doDrity();
    }

    public deserialized(data: any): void {
        this._time = get(data, '0', Tools.GetNowMoment().valueOf());
        this._earnList = get(data, '4', []);
        this._maxTime = get(data, '1', 0);
        this._curTime = get(data, '2', 0);
        this._tip = get(data, '3', true);
        this.doDrity();
    }

    public serializeInfo(): any {
        const result: any = {};
        set(result, '0', this._time);
        set(result, '4', this._earnList);
        set(result, '1', this._maxTime);
        set(result, '2', this._curTime);
        set(result, '3', this._tip);
        return result;
    }

    get time(): number {
        return this._time;
    }

    set time(value: number) {
        this._time = value;
        this.doDrity();
    }

    get maxTime(): number {
        return this._maxTime;
    }

    set maxTime(value: number) {
        this._maxTime = value;
        this.doDrity();
    }

    get curTime(): number {
        return this._curTime;
    }

    set curTime(value: number) {
        this._curTime = value;
        this.doDrity();
    }

    get tip(): boolean {
        return this._tip;
    }

    set tip(value: boolean) {
        this._tip = value;
        this.doDrity();
    }

    get earnList(): any[] {
        return this._earnList;
    }

    set earnList(value: any[]) {
        this._earnList = value;
        this.doDrity();
    }
}