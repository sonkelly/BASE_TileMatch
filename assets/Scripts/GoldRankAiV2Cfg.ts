import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GoldRankAiV2Cfg')
export default class GoldRankAiV2Cfg extends ICfgParse {
    private static _instance: GoldRankAiV2Cfg | null = null;
    
    public jsonFileName = 'goldRankAiV2';

    public static get Instance(): GoldRankAiV2Cfg {
        if (!this._instance) {
            this._instance = new GoldRankAiV2Cfg().load();
        }
        return this._instance;
    }

    public loaded(): void {
        each(this._cfg, (config: any) => {
            const aiAddPoint = config.aiAddPoint;
            config.aiAddPointRange = [];
            
            for (let i = 0; i < aiAddPoint.length; i++) {
                const range = aiAddPoint[i].split('|').map((val: string) => Number(val));
                config.aiAddPointRange.push(range);
            }
        });
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public getAiRankAddInfo(rank: number): { 
        rank: number; 
        index: number; 
        aiTime: number; 
        aiPercent: number; 
        aiAddRange: number[] 
    } {
        const config = this.get(1);
        let index = config.aiRank.length - 1;
        
        for (let i = config.aiRank.length - 1; i >= 0; i--) {
            if (rank >= config.aiRank[i]) {
                break;
            }
            index--;
        }

        return {
            rank: rank,
            index: index,
            aiTime: config.aiTimeMax[index],
            aiPercent: config.aiProbability[index],
            aiAddRange: config.aiAddPointRange[index]
        };
    }
}