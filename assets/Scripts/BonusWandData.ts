import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import { get } from 'lodash-es';

const { ccclass, property } = _decorator;

export enum BonusWandStatus {
    None = 0,
    Idle = 1,
    Active = 2
}

@ccclass('BonusWandData')
export class BonusWandData extends IDataObject {
    private _guide: number = 0;
    private _giftProp: number = 0;
    private _status: BonusWandStatus = BonusWandStatus.None;
    private _winCount: number = 0;
    private _dirtyWinCount: number = 0;
    private _cacheWinCount: number = 0;
    private _useCount: number = 0;

    deserialized(data: any): void {
        this._winCount = get(data, 0) || 0;
        this._cacheWinCount = get(data, 1) || 0;
        this._status = get(data, 2) || BonusWandStatus.None;
        this._useCount = get(data, 3) || 0;
        this._guide = get(data, 4) || 0;
        this._giftProp = get(data, 5) || 0;
    }

    serializeInfo(): any {
        return {
            0: this._winCount,
            1: this._cacheWinCount,
            2: this._status,
            3: this._useCount,
            4: this._guide,
            5: this._giftProp
        };
    }

    get guide(): number {
        return this._guide;
    }

    set guide(value: number) {
        this._guide = value;
        this.doDrity();
    }

    get giftProp(): number {
        return this._giftProp;
    }

    set giftProp(value: number) {
        this._giftProp = value;
        this.doDrity();
    }

    get status(): BonusWandStatus {
        return this._status;
    }

    set status(value: BonusWandStatus) {
        this._status = value;
        this.doDrity();
    }

    get winCount(): number {
        return this._winCount;
    }

    set winCount(value: number) {
        this._winCount = value;
        this.doDrity();
    }

    get dirtyWinCount(): number {
        return this._dirtyWinCount;
    }

    set dirtyWinCount(value: number) {
        this._dirtyWinCount = value;
    }

    get cacheWinCount(): number {
        return this._cacheWinCount;
    }

    set cacheWinCount(value: number) {
        this._cacheWinCount = value;
        this.doDrity();
    }

    get useCount(): number {
        return this._useCount;
    }

    set useCount(value: number) {
        this._useCount = value;
        this.doDrity();
    }
}