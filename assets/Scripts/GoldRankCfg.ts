import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GoldRankCfg')
export class GoldRankCfg extends ICfgParse {
    private static _instance: GoldRankCfg;
    
    constructor() {
        super();
        this.jsonFileName = 'goldRank';
    }

    public static get Instance(): GoldRankCfg {
        if (!GoldRankCfg._instance) {
            GoldRankCfg._instance = new GoldRankCfg().load() as GoldRankCfg;
        }
        return GoldRankCfg._instance;
    }

    public loaded(): void {
        each(this._cfg, (config: any) => {
            config.rankStartPointRange = config.rankStartPoint.split(',').map((val: string) => Number(val));
            config.rankStartDayPointRange = config.rankStartDayPoint.split(',').map((val: string) => Number(val));
            config.rankCrownRewardMap = new Map();
            config.rankCrownRewardIds = [];
            
            config.rankCrownReward.split(',').forEach((rewardStr: string) => {
                const [id, value] = rewardStr.split('|').map((num: string) => Number(num));
                config.rankCrownRewardMap.set(value, id);
                config.rankCrownRewardIds.push(value);
            });
        });
    }

    public get(key: number): any {
        return this.cfg[key];
    }

    public getGoldRankRewardMap(): Map<number, number> {
        return this._cfg[1].rankCrownRewardMap;
    }

    public getGoldRankRewardIds(): number[] {
        return this._cfg[1].rankCrownRewardIds;
    }

    public getRankPlayerNum(): number {
        return this._cfg[1].rankPlayerNum;
    }

    public getRankPlayerShowCnt(): number {
        return this._cfg[1].rankPlayerShow;
    }

    public getRankStartPoint(): number[] {
        return this._cfg[1].rankStartPointRange;
    }

    public getRankStartDayPoint(): number[] {
        return this._cfg[1].rankStartDayPointRange;
    }
}