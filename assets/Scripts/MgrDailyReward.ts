import { _decorator, cclegacy } from 'cc';
import {MgrBase} from './MgrBase';
import { DailyRewardData } from './DailyRewardData';
import {isSameUtcDate} from './TimeUtil';

const { ccclass, property } = _decorator;

@ccclass('MgrDailyReward')
export class MgrDailyReward extends MgrBase {
    private _dailyReward: DailyRewardData | null = null;

    onLoad() {
        this._dailyReward = new DailyRewardData('daily-reward');
    }

    isNewDay(): boolean {
        return !isSameUtcDate(this._dailyReward!.lastRewardTime);
    }

    getWeightItems() {
        // Implementation needed
    }

    load() {
        this._dailyReward!.load();
    }

    initLoadData() {
        // Implementation needed
    }

    get dailyReward(): DailyRewardData | null {
        return this._dailyReward;
    }

    private static _instance: MgrDailyReward;
    static get Instance(): MgrDailyReward {
        return MgrDailyReward._instance;
    }
}