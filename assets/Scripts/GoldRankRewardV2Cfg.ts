import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('GoldRankRewardV2Cfg')
export class GoldRankRewardV2Cfg extends ICfgParse {
    private static _instance: GoldRankRewardV2Cfg;
    
    constructor() {
        super();
        this.jsonFileName = 'goldRankRewardV2';
    }

    public static get Instance(): GoldRankRewardV2Cfg {
        if (!this._instance) {
            this._instance = new GoldRankRewardV2Cfg().load();
        }
        return this._instance;
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public getRewardById(id: number): { flower: number; itemId: number; itemCount: number } | null {
        const data = this.get(id);
        if (!data) {
            return null;
        }

        const flower = data.flowerReward || 0;
        let itemId = -1;
        let itemCount = 0;

        if (data.reward) {
            const rewardParts = data.reward.split('|');
            const rewardId = rewardParts[0];
            const rewardCount = rewardParts[1];
            itemId = Number(rewardId);
            itemCount = Number(rewardCount);
        }

        return {
            flower: flower,
            itemId: itemId,
            itemCount: itemCount
        };
    }

    public getAllRewardStrById(id: number): string {
        let result = '';
        const data = this.get(id);
        
        if (data) {
            result += data.reward;
            result += ',' + ITEM.ChallengeStar + '|' + data.flowerReward;
        }
        
        return result;
    }
}