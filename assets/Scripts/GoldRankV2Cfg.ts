import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GoldRankV2Cfg')
export class GoldRankV2Cfg extends ICfgParse {
    private static _instance: GoldRankV2Cfg | null = null;
    public jsonFileName: string = 'goldRankV2';

    constructor(...args: any[]) {
        super(...args);
    }

    loaded() {
        each(this._cfg, (cfgItem: any) => {
            cfgItem.rankStartPointRange = cfgItem.rankStartPoint.split(',').map((value: string) => Number(value));
            cfgItem.rankStartDayPointRange = cfgItem.rankStartDayPoint.split(',').map((value: string) => Number(value));
            cfgItem.rankCrownRewardMap = new Map<number, number>();
            cfgItem.rankCrownRewardIds = [];
            cfgItem.rankCrownReward.split(',').forEach((reward: string) => {
                const [rewardId, rewardValue] = reward.split('|').map((value: string) => Number(value));
                cfgItem.rankCrownRewardMap.set(rewardValue, rewardId);
                cfgItem.rankCrownRewardIds.push(rewardValue);
            });
        });
    }

    get(cfgKey: string) {
        return this.cfg[cfgKey];
    }

    getGoldRankRewardMap() {
        return this._cfg[1].rankCrownRewardMap;
    }

    getGoldRankRewardIds() {
        return this._cfg[1].rankCrownRewardIds;
    }

    getRankPlayerNum() {
        return this._cfg[1].rankPlayerNum;
    }

    getRankPlayerShowCnt() {
        return this._cfg[1].rankPlayerShow;
    }

    getRankStartPoint() {
        return this._cfg[1].rankStartPointRange;
    }

    getRankStartDayPoint() {
        return this._cfg[1].rankStartDayPointRange;
    }

    static get Instance() {
        if (!GoldRankV2Cfg._instance) {
            GoldRankV2Cfg._instance = new GoldRankV2Cfg();
            GoldRankV2Cfg._instance.load();
        }
        return GoldRankV2Cfg._instance;
    }
}