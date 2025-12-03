import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import { get, set } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('LevelChestData')
export class LevelChestData extends IDataObject {
    private _chestLv: number = 0;

    public setChestLv(lv: number): void {
        if (lv > this._chestLv) {
            this._chestLv = lv;
            this.doDrity();
        }
    }

    public deserialized(data: any): void {
        this._chestLv = get(data, 'chestShowLv') || 0;
        this.doDrity();
    }

    public serializeInfo(): any {
        const data: any = {};
        set(data, 'chestShowLv', this._chestLv);
        return data;
    }

    public get chestLv(): number {
        return this._chestLv;
    }
}