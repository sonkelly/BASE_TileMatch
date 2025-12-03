import { _decorator, cclegacy, director } from 'cc';
import {IDataObject} from './IDataObject';
import { GameConst } from './GameConst';
import { GlobalEvent } from './Events';
import {Utils} from './Utils';
import {Tools} from './Tools';
import {get, set} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('PigData')
export class PigData extends IDataObject {
    private _pigCoin: number = 0;
    private _pigPopTimeStamp: number = 0;
    private _pigPopCnt: number = 0;
    private _passLvCnt: number = 0;
    private _pigFullTimeStamp: number = 0;

    public resetData(): void {
        this._pigCoin = GameConst.GOLDEN_PIG_MIN_COIN;
        this._pigPopTimeStamp = 0;
        this._pigPopCnt = 0;
        this._passLvCnt = 0;
        this._pigFullTimeStamp = 0;
        this.doDrity();
        director.emit(GlobalEvent.goldPigRefreshCoin);
    }

    public checkPopTimeAndCnt(): void {
        if (!Utils.isSameDay(Tools.GetNowTime(), this._pigPopTimeStamp)) {
            this._pigPopTimeStamp = Tools.GetNowTime();
            this._pigPopCnt = 0;
            this._passLvCnt = 0;
            this.doDrity();
        }
    }

    private _checkPigFull(): void {
        if (!this._pigFullTimeStamp && this._pigCoin >= GameConst.GOLDEN_PIG_MAX_COIN) {
            this.pigFullTimeStamp = Tools.GetNowTime();
        }
    }

    public deserialized(data: any): void {
        this._pigCoin = get(data, 'pig-coin', GameConst.GOLDEN_PIG_MIN_COIN);
        this._pigPopTimeStamp = get(data, 'pig-pop-timestamp', 0);
        this._pigPopCnt = get(data, 'pig-pop-cnt', 0);
        this._passLvCnt = get(data, 'pass-lv-cnt', 0);
        this._pigFullTimeStamp = get(data, 'pig-full-timestamp', 0);
        this.checkPopTimeAndCnt();
        this._checkPigFull();
    }

    public serializeInfo(): any {
        const data = {};
        set(data, 'pig-coin', this._pigCoin);
        set(data, 'pig-pop-timestamp', this._pigPopTimeStamp);
        set(data, 'pig-pop-cnt', this._pigPopCnt);
        set(data, 'pass-lv-cnt', this._passLvCnt);
        set(data, 'pig-full-timestamp', this._pigFullTimeStamp);
        return data;
    }

    public get pigCoin(): number {
        return this._pigCoin;
    }

    public set pigCoin(value: number) {
        this._pigCoin = value;
        this.doDrity();
    }

    public get pigPopCnt(): number {
        return this._pigPopCnt;
    }

    public set pigPopCnt(value: number) {
        this._pigPopCnt = value;
        this.doDrity();
    }

    public get passLvCnt(): number {
        return this._passLvCnt;
    }

    public set passLvCnt(value: number) {
        this._passLvCnt = value;
        this.doDrity();
    }

    public get pigFullTimeStamp(): number {
        return this._pigFullTimeStamp;
    }

    public set pigFullTimeStamp(value: number) {
        this._pigFullTimeStamp = value;
        this.doDrity();
    }
}