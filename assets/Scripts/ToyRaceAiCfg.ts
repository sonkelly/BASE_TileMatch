import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('ToyRaceAiCfg')
export class ToyRaceAiCfg extends ICfgParse {
    private static _instance: ToyRaceAiCfg = null;
    public jsonFileName: string = 'ToyRaceAi';
    public dataLen: number = 0;
    public cfgArr: any[] = [];

    constructor(...args: any[]) {
        super(...args);
    }

    public loaded(): void {
        for (const key in this.cfg) {
            this.cfgArr.push(this.cfg[key]);
        }
        this.dataLen = this.cfgArr.length;
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public getRandomId(): number {
        return this.cfgArr[Math.floor(Math.random() * this.dataLen)].id;
    }

    public getAiInfo(id: number, rank: number): any {
        const config = this.get(id);
        let index = 0;
        let aiTimeMax = 0;
        let aiProbability = 0;
        let aiNumMax = 0;
        let aiRankMax = 0;

        for (let i = 0; i < config.aiRank.length; i++) {
            if (rank <= config.aiRank[i]) {
                index = i;
                aiTimeMax = config.aiTimeMax[i];
                aiProbability = config.aiProbability[i];
                aiNumMax = config.aiNumMax[i];
                aiRankMax = config.aiRankMax[i];
                break;
            }
        }

        return {
            rank: rank,
            index: index,
            aiTimeMax: aiTimeMax,
            aiProbability: aiProbability,
            aiNumMax: aiNumMax,
            aiRankMax: aiRankMax
        };
    }

    public static get Instance(): ToyRaceAiCfg {
        if (!ToyRaceAiCfg._instance) {
            ToyRaceAiCfg._instance = new ToyRaceAiCfg().load();
        }
        return ToyRaceAiCfg._instance;
    }
}