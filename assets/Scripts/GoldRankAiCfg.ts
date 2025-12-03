import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GoldRankAiCfg')
export default class GoldRankAiCfg extends ICfgParse {
    private static _instance: GoldRankAiCfg | null = null;

    constructor() {
        super();
        this.jsonFileName = 'goldRankAi';
    }

    public static get Instance(): GoldRankAiCfg {
        if (!GoldRankAiCfg._instance) {
            GoldRankAiCfg._instance = new GoldRankAiCfg().load() as GoldRankAiCfg;
        }
        return GoldRankAiCfg._instance;
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