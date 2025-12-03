import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('RankCfg')
export class RankCfg extends ICfgParse {
    private static _instance: RankCfg | null = null;
    
    jsonFileName = 'rank';

    public static get Instance(): RankCfg {
        if (!RankCfg._instance) {
            RankCfg._instance = new RankCfg().load() as RankCfg;
        }
        return RankCfg._instance;
    }

    loaded(): void {
        each(this._cfg, (config: any) => {
            config.rankStartPointRange = config.rankStartPoint.split(',').map((num: string) => Number(num));
            config.rankStartDayPointRange = config.rankStartDayPoint.split(',').map((num: string) => Number(num));
        });
    }

    get(type: any): any {
        return this.cfg[type];
    }

    getRankPlayerNum(type: any): number {
        const config = this.get(type);
        return config ? config.rankPlayerNum : (console.error('no cfg! type:', type), 0);
    }

    getRankPlayerShowCnt(type: any): number {
        const config = this.get(type);
        return config ? config.rankPlayerShow : (console.error('no cfg! type:', type), 50);
    }

    getRankStartPoint(type: any): number[] | null {
        const config = this.get(type);
        return config ? config.rankStartPointRange : (console.error('no cfg! type:', type), null);
    }

    getRankStartDayPoint(type: any): number[] | null {
        const config = this.get(type);
        return config ? config.rankStartDayPointRange : (console.error('no cfg! type:', type), null);
    }
}