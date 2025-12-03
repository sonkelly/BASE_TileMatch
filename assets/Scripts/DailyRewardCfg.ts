import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('DailyRewardCfg')
export default class DailyRewardCfg extends ICfgParse {
    private static _instance: DailyRewardCfg | null = null;

    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'dailyReward';
    }

    public get(key: number): any {
        return this.cfg[key];
    }

    public static get Instance(): DailyRewardCfg {
        if (!DailyRewardCfg._instance) {
            DailyRewardCfg._instance = new DailyRewardCfg().load();
        }
        return DailyRewardCfg._instance;
    }
}