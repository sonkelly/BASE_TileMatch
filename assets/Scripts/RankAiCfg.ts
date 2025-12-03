import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('RankAiCfg')
export class RankAiCfg extends ICfgParse {
    public static _instance: RankAiCfg | null = null;
    public jsonFileName: string = 'rankAi';

    public static get Instance(): RankAiCfg {
        if (!RankAiCfg._instance) {
            RankAiCfg._instance = new RankAiCfg().load() as RankAiCfg;
        }
        return RankAiCfg._instance;
    }

    public loaded(): void {
        each(this._cfg, (item: any) => {
            const aiAddPoint = item.aiAddPoint;
            item.aiAddPointRange = [];
            
            for (let i = 0; i < aiAddPoint.length; i++) {
                const range = aiAddPoint[i].split('|').map((val: string) => Number(val));
                item.aiAddPointRange.push(range);
            }
        });
    }

    public get(key: number): any {
        return this.cfg[key];
    }

    public getAiRankAddInfo(rank: number, key: number): {
        rank: number;
        index: number;
        aiTime: number;
        aiPercent: number;
        aiAddRange: number[];
    } {
        const config = this.get(key);
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