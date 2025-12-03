import { _decorator, cclegacy } from 'cc';
import { each } from 'lodash-es';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('StarLeagueCfg')
class StarLeagueCfg extends ICfgParse {
    private static _instance: StarLeagueCfg | null = null;
    private _maxStage: number = 0;
    public jsonFileName: string = 'StarLeague';

    constructor(...args: any[]) {
        super(...args);
    }

    public loaded(): void {
        each(this.cfg, (cfgItem: any) => {
            this._maxStage = Math.max(this._maxStage, cfgItem.id);
            for (let stage = 1; stage <= 4; stage++) {
                this.processRewards(cfgItem, stage);
            }
        });
    }

    private processRewards(cfgItem: any, stage: number): void {
        cfgItem['reward' + stage].forEach((reward: string) => {
            const [id, count] = reward.split('|').map(Number);
            if (!cfgItem['rewards' + stage]) {
                cfgItem['rewards' + stage] = [];
            }
            cfgItem['rewards' + stage].push({ id, count });
        });
    }

    public get(cfgId: number): any {
        return this.cfg[cfgId];
    }

    public static get Instance(): StarLeagueCfg {
        if (!StarLeagueCfg._instance) {
            StarLeagueCfg._instance = new StarLeagueCfg();
            StarLeagueCfg._instance.load();
        }
        return StarLeagueCfg._instance;
    }

    public get maxStage(): number {
        return this._maxStage;
    }
}

export default StarLeagueCfg;