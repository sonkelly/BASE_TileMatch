import { _decorator, cclegacy } from 'cc';
import { each, set } from 'lodash-es';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('StarLeagueAiCfg')
export class StarLeagueAiCfg extends ICfgParse {
    private static _instance: StarLeagueAiCfg | null = null;
    private _stageIds: Map<number, number[]> = new Map();
    private _idCfg: { [key: number]: any } = {};

    constructor() {
        super();
        this.jsonFileName = 'StarLeagueAi';
    }

    loaded(): void {
        const self = this;
        each(this._cfg, (cfgItem: any) => {
            let stageIds = self._stageIds.get(cfgItem.stage);
            if (!stageIds) {
                stageIds = [];
                self._stageIds.set(cfgItem.stage, stageIds);
            }
            stageIds.push(cfgItem.id);

            const aiAddPointRanges: number[][] = [];
            for (let i = 0; i < cfgItem.aiAddPoint.length; i++) {
                const range = cfgItem.aiAddPoint[i].split('|').map((val: string) => Number(val));
                aiAddPointRanges.push(range);
            }

            const aiCfg = {
                id: cfgItem.id,
                stage: cfgItem.stage,
                aiRank: cfgItem.aiRank,
                aiTimeMax: cfgItem.aiTimeMax,
                aiProbability: cfgItem.aiProbability,
                aiAddPoint: cfgItem.aiAddPoint,
                aiAddPointRange: aiAddPointRanges
            };

            set(self._idCfg, cfgItem.id, aiCfg);
        });
    }

    get(id: number): any {
        return this._idCfg[id];
    }

    getRandomCfgIdByStage(stage: number): number {
        const stageIds = this._stageIds.get(stage);
        return stageIds![Math.floor(Math.random() * stageIds!.length)];
    }

    getStarLeagueAiValue(id: number, value: number): any {
        const cfg = this.get(id);
        let index = cfg.aiRank.length - 1;
        
        for (let i = cfg.aiRank.length - 1; i >= 0; i--) {
            if (value >= cfg.aiRank[i]) {
                break;
            }
            index--;
        }

        return {
            index: index,
            aiRank: cfg.aiRank[index],
            aiTime: cfg.aiTimeMax[index],
            aiPercent: cfg.aiProbability[index],
            aiAddRange: cfg.aiAddPointRange[index]
        };
    }

    static get Instance(): StarLeagueAiCfg {
        if (!StarLeagueAiCfg._instance) {
            StarLeagueAiCfg._instance = new StarLeagueAiCfg().load() as StarLeagueAiCfg;
        }
        return StarLeagueAiCfg._instance;
    }
}
