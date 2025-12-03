import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { GameConst } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('GoldRankRewardCfg')
export class GoldRankRewardCfg extends ICfgParse {
    private static _instance: GoldRankRewardCfg;
    
    constructor() {
        super();
        this.jsonFileName = 'goldRankReward';
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
            result += ',' + GameConst.GoldFlower + '|' + data.flowerReward;
        }
        
        return result;
    }

    public static get Instance(): GoldRankRewardCfg {
        if (!this._instance) {
            this._instance = new GoldRankRewardCfg().load();
        }
        return this._instance;
    }
}