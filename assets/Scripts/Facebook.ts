import { _decorator, cclegacy, sys, native } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Facebook')
export class Facebook {
    private static readonly levelThresholds: number[] = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
    private static readonly bannerThresholds: number[] = [1, 5, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200];
    private static readonly insertionThresholds: number[] = [1, 5, 10, 15, 20, 25, 30, 40, 50, 80, 100, 150];
    private static readonly rewardThresholds: number[] = [1, 5, 10, 15, 20];
    private static readonly faceBookApi: string = 'com/cocos/game/FBAnalytices';

    public static reportLevelEnd(level: number): void {
        if (Facebook.levelThresholds.includes(level)) {
            const eventName = `fb_level_end_success_${level}`;
            Facebook.reportEvent(eventName);
        }
    }

    public static reportBanner(count: number): void {
        if (Facebook.bannerThresholds.includes(count)) {
            const eventName = `fb_BannerADs_${count}`;
            Facebook.reportEvent(eventName);
        }
    }

    public static reportInsertion(count: number): void {
        if (Facebook.insertionThresholds.includes(count)) {
            const eventName = `fb_InsertionADs_${count}`;
            Facebook.reportEvent(eventName);
        }
    }

    public static reportReward(count: number): void {
        if (Facebook.rewardThresholds.includes(count)) {
            const eventName = `fb_AdRewardAD_${count}`;
            Facebook.reportEvent(eventName);
        }
    }

    public static reportEventWithValue(eventName: string, value: any): void {
        if (sys.isNative) {
            let valueString: string = '';
            try {
                valueString = JSON.stringify(value);
            } catch (error) {
                valueString = String(value);
            }
            native.reflection.callStaticMethod(
                Facebook.faceBookApi,
                'FBReportEvent',
                '(Ljava/lang/String;Ljava/lang/String;)V',
                eventName,
                valueString
            );
        }
    }

    public static reportEvent(eventName: string): void {
        if (sys.isNative) {
            native.reflection.callStaticMethod(
                Facebook.faceBookApi,
                'FBReportEvent',
                '(Ljava/lang/String;)V',
                eventName
            );
        }
    }

    public static reportPurchase(amount: number): void {
        if (sys.isNative) {
            native.reflection.callStaticMethod(
                Facebook.faceBookApi,
                'FBReportPurchase',
                '(Ljava/lang/String;)V',
                amount.toString()
            );
        }
    }
}