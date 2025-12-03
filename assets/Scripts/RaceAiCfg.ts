import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('RaceAiCfg')
export class RaceAiCfg extends ICfgParse {
    private static _instance: RaceAiCfg = null;
    private _ids: number[] = [];

    constructor() {
        super();
        this.jsonFileName = 'raceAi';
    }

    public loaded(): void {
        const self = this;
        each(this._cfg, (value: any, key: string) => {
            self._ids.push(value.id);
        });
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public getRandomId(): number {
        return this._ids[Math.floor(Math.random() * this._ids.length)];
    }

    public getAiRankAddInfo(id: string, rank: number): {
        rank: number;
        index: number;
        aiTimeMax: number;
        aiProbability: number;
        aiNumMax: number;
        aiRankMax: number;
    } {
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

    public static get Instance(): RaceAiCfg {
        if (!RaceAiCfg._instance) {
            RaceAiCfg._instance = new RaceAiCfg().load();
        }
        return RaceAiCfg._instance;
    }
}