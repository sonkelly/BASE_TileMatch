import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each, get, set } from 'lodash-es';
const { ccclass, property } = _decorator;

@ccclass('MineCfg')
export class MineCfg extends ICfgParse {
    private static _instance: MineCfg | null = null;
    private _maxStage: number = 0;

    constructor() {
        super();
        this.jsonFileName = 'mine';
    }

    loaded(): void {
        const self = this;
        each(this.cfg, (config: any) => {
            self._maxStage = Math.max(self._maxStage, config.id);
            config.reward.forEach((rewardStr: string) => {
                const rewardParts = rewardStr.split('|');
                const rewardInfo = get(config, 'rewardInfo', []);
                rewardInfo.push({
                    id: Number(rewardParts[0]),
                    count: Number(rewardParts[1])
                });
                set(config, 'rewardInfo', rewardInfo);
            });
        });
    }

    get(id: number): any {
        return this.cfg[id];
    }

    get maxStage(): number {
        return this._maxStage;
    }

    static get Instance(): MineCfg {
        if (!MineCfg._instance) {
            MineCfg._instance = new MineCfg().load();
        }
        return MineCfg._instance;
    }
}