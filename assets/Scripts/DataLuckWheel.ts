import { _decorator, cclegacy, director } from 'cc';
import {IDataObject} from './IDataObject';
import {set} from 'lodash-es';
import { Tools } from './Tools';
import { Utils } from './Utils';
import {TurntableRewardCfg} from './TurntableRewardCfg';
import { GlobalEvent } from './Events';
import {get} from "lodash-es"

const { ccclass, property } = _decorator;

@ccclass('DataLuckWheel')
export class DataLuckWheel extends IDataObject {
    private _isNew: boolean = true;
    private _luckWheelData: any = null;

    constructor(...args: any[]) {
        super(...args);
        this._isNew = true;
        this._luckWheelData = null;
    }

    public initLuckWheelData(): void {
        const refreshTime = this._luckWheelData?.refresh || 0;
        const isSameDayFlag = Utils.isSameDay(Tools.GetNowTime(), refreshTime);
        if (!refreshTime || !isSameDayFlag) {
            this._refreshLuckWheelData();
        }
    }

    private _refreshLuckWheelData(): void {
        let groupId = this._luckWheelData?.groupId || 0;
        groupId++;
        if (groupId > TurntableRewardCfg.Instance.groupIds.length) {
            groupId = 1;
        }
        
        this._luckWheelData.refresh = Tools.GetNowTime();
        this._luckWheelData.ownReward = [];
        this._luckWheelData.useTime = 0;
        this._luckWheelData.groupId = groupId;
        
        director.emit(GlobalEvent.luckWheelRefreshData);
        this.doDrity();
    }

    public getRefreshTime(): number {
        return this._luckWheelData?.refresh || 0;
    }

    public addLuckWheelDataUseTime(): void {
        this._luckWheelData.useTime++;
        this.doDrity();
    }

    public addLuckWheelDataOwnReward(reward: any): void {
        this._luckWheelData.ownReward.push(reward);
        this.doDrity();
    }

    public deserialized(data: any): void {
        this._isNew = get(data, 'isNew', true);
        this._luckWheelData = get(data, 'luck-wheel-data', {});
    }

    public serializeInfo(): any {
        const result: any = {};
        set(result, 'isNew', this._isNew);
        set(result, 'luck-wheel-data', this._luckWheelData);
        return result;
    }

    get isNew(): boolean {
        return this._isNew;
    }

    set isNew(value: boolean) {
        this._isNew = value;
        this.doDrity();
    }

    get luckWheelData(): any {
        return this._luckWheelData;
    }
}