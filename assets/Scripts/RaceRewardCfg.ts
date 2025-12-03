import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('RaceRewardCfg')
export class RaceRewardCfg extends ICfgParse {
    private static _instance: RaceRewardCfg | null = null;

    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'raceReward';
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public static get Instance(): RaceRewardCfg {
        if (!RaceRewardCfg._instance) {
            RaceRewardCfg._instance = new RaceRewardCfg().load();
        }
        return RaceRewardCfg._instance;
    }
}