import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each } from 'lodash-es';
import { Tools } from './Tools';

const { ccclass, property } = _decorator;

@ccclass('RankAiNameCfg')
export class RankAiNameCfg extends ICfgParse {
    private static _instance: RankAiNameCfg | null = null;
    private _aiNameIds: number[] = [];

    constructor() {
        super();
        this.jsonFileName = 'rankAiName';
    }

    public loaded(): void {
        const self = this;
        each(this.cfg, (config: any) => {
            self._aiNameIds.push(config.id);
        });
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public radomAiNameIds(count: number): number[] | null {
        if (count > this._aiNameIds.length) {
            console.error('rangeErr! cnt:', count);
            return null;
        }
        return Tools.getRandomArrayElements(this._aiNameIds, count);
    }

    public static get Instance(): RankAiNameCfg {
        if (!RankAiNameCfg._instance) {
            RankAiNameCfg._instance = new RankAiNameCfg().load();
        }
        return RankAiNameCfg._instance;
    }
}