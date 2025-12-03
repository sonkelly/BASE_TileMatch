import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import {Tools} from './Tools';

const { ccclass, property } = _decorator;

@ccclass('MonthTileCfg')
export class MonthTileCfg extends ICfgParse {
    private static _instance: MonthTileCfg | null = null;

    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'monthTile';
    }

    public get(id: number): any {
        return this.cfg[id] ? this.cfg[id] : (console.error('no data by id:', id), null);
    }

    public getNowMonthCfg(): any {
        const month = Tools.GetNowDate().getMonth() + 1;
        return this.get(month);
    }

    public static get Instance(): MonthTileCfg {
        if (!MonthTileCfg._instance) {
            MonthTileCfg._instance = new MonthTileCfg().load();
        }
        return MonthTileCfg._instance;
    }
}