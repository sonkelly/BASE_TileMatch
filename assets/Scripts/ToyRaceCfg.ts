import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('ToyRaceCfg')
export class ToyRaceCfg extends ICfgParse {
    private static _instance: ToyRaceCfg;
    private jsonFileName: string = 'ToyRace';

    public static get Instance(): ToyRaceCfg {
        if (!this._instance) {
            this._instance = new ToyRaceCfg().load();
        }
        return this._instance;
    }

    public loaded(): void {
        for (const key in this.cfg) {
            const config = this.cfg[key];
            config.reward.forEach((rewardStr: string) => {
                const rewardParts = rewardStr.split('|');
                if (!config.rewards) {
                    config.rewards = [];
                }
                config.rewards.push({
                    id: Number(rewardParts[0]),
                    count: Number(rewardParts[1])
                });
            });
        }
    }

    public get(key: string): any {
        return this.cfg[key];
    }
}