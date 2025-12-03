import { _decorator, cclegacy } from 'cc';
import {  IDataObject } from './IDataObject';
import {get, set} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('DailyRewardData')
export class DailyRewardData extends IDataObject {
    private _lastRewardTime: number | null = null;

    public deserialized(data: any): void {
        this._lastRewardTime = get(data, 'lastRewardTime', 0) || 0;
        this.doDrity();
    }

    public serializeInfo(): any {
        const data = {};
        set(data, 'lastRewardTime', this._lastRewardTime);
        return data;
    }

    public get lastRewardTime(): number | null {
        return this._lastRewardTime;
    }

    public set lastRewardTime(value: number | null) {
        this._lastRewardTime = value;
        this.doDrity();
    }
}