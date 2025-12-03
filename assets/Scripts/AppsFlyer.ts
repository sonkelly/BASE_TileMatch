import { _decorator, sys } from 'cc';
import {Tools} from './Tools';
import { AFDot } from './AFDot';
import { config } from './Config';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass } = _decorator;

@ccclass('AppsFlyer')
export class AppsFlyer {
    private static levelThresholds: number[] = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
    private static bannerThresholds: number[] = [1, 5, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200];
    private static insertionThresholds: number[] = [1, 5, 10, 15, 20, 25, 30, 40, 50, 80, 100, 150];
    private static rewardThresholds: number[] = [1, 5, 10, 15, 20];

    public static reportLevelEnd(level: number): void {
        if (AppsFlyer.levelThresholds.includes(level)) {
            const eventName = `af_level_end_success_${level}`;
            AppsFlyer.reportEvent(eventName);
        }
    }

    public static reportBanner(count: number): void {
        if (AppsFlyer.bannerThresholds.includes(count)) {
            const eventName = `af_BannerADs_${count}`;
            AppsFlyer.reportEvent(eventName);
        }
    }

    public static reportInsertion(count: number): void {
        if (AppsFlyer.insertionThresholds.includes(count)) {
            const eventName = `af_InsertionADs_${count}`;
            AppsFlyer.reportEvent(eventName);
        }
    }

    public static reportReward(count: number): void {
        if (AppsFlyer.rewardThresholds.includes(count)) {
            const eventName = `af_AdRewardAD_${count}`;
            AppsFlyer.reportEvent(eventName);
        }
    }

    public static reportStartLogin(loginTime: string): void {
        const now = Tools.GetNowMoment();
        const loginDate = moment(loginTime);
        
        if (now.diff(loginDate, 'day') === 1) {
            const storageKey = `${config.gameName}_af_onedayretention`;
            const retentionFlag = sys.localStorage.getItem(storageKey) || '0';
            
            if (retentionFlag === '0') {
                sys.localStorage.setItem(storageKey, '1');
                AppsFlyer.reportEvent('af_Oneday_Retention');
            }
        }
    }

    public static reportEvent(eventName: string): void {
        AFDot.sendEvent(eventName, {});
    }
}