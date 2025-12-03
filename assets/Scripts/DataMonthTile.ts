import { _decorator } from 'cc';
import {IDataObject} from './IDataObject';
import {set, get} from 'lodash-es';

const { ccclass } = _decorator;

@ccclass('DataMonthTile')
export class DataMonthTile extends IDataObject {
    private _normalActive: any = null;
    private _challengeActive: any = null;

    get normalActive() {
        return this._normalActive;
    }

    get challengeActive() {
        return this._challengeActive;
    }

    refreshNormalActive(level: any, sTile: any, tTile: any) {
        this._normalActive = {
            level,
            sTile,
            tTile,
        };
        this.doDrity();
    }

    refreshChallengeActive(level: any, sTile: any, tTile: any) {
        this._challengeActive = {
            level,
            sTile,
            tTile,
        };
        this.doDrity();
    }

    deserialized(data: any) {
        this._normalActive = get(data, 'Normal', {});
        this._challengeActive = get(data, 'Challenge', {});
    }

    serializeInfo() {
        const out: any = {};
        set(out, 'Challenge', this._challengeActive);
        set(out, 'Normal', this._normalActive);
        return out;
    }
}