import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('DailyChallengeCfg')
export class DailyChallengeCfg extends ICfgParse {
    private static _instance: DailyChallengeCfg | null = null;

    constructor() {
        super();
        this.jsonFileName = 'dailyChallenge';
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public static get Instance(): DailyChallengeCfg {
        if (!DailyChallengeCfg._instance) {
            DailyChallengeCfg._instance = new DailyChallengeCfg().load();
        }
        return DailyChallengeCfg._instance;
    }
}