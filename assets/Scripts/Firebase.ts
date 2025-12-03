import { _decorator, cclegacy, sys, native } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Firebase')
export class Firebase {
    private static readonly levelEndThresholds: number[] = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
    private static readonly bannerThresholds: number[] = [1, 5, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200];
    private static readonly insertionThresholds: number[] = [1, 5, 10, 15, 20, 25, 30, 40, 50, 80, 100, 150];
    private static readonly rewardThresholds: number[] = [1, 5, 10, 15, 20];
    
    private static readonly fireBaseApi: string = 'com/cocos/game/FireBaseAnalytices';

    public static reportLevelEnd(level: number): void {
        if (this.levelEndThresholds.includes(level)) {
            const eventName = `level_end_success_${level}`;
            this.reportEvent(eventName, { level });
        }
    }

    public static reportBanner(count: number): void {
        if (this.bannerThresholds.includes(count)) {
            const eventName = `BannerADs_${count}`;
            this.reportEvent(eventName, { count });
        }
    }

    public static reportInsertion(count: number): void {
        if (this.insertionThresholds.includes(count)) {
            const eventName = `InsertionADs_${count}`;
            this.reportEvent(eventName, { count });
        }
    }

    public static reportReward(count: number): void {
        if (this.rewardThresholds.includes(count)) {
            const eventName = `AdRewardAD_${count}`;
            this.reportEvent(eventName, { count });
        }
    }

    public static reportEvent(eventName: string, parameters: any): void {
        if (sys.isNative) {
            let paramString: string = '';
            try {
                paramString = JSON.stringify(parameters);
            } catch (error) {
                paramString = parameters.toString();
            }
            
            native.reflection.callStaticMethod(
                this.fireBaseApi,
                'FirebaseReportEvent',
                '(Ljava/lang/String;Ljava/lang/String;)V',
                eventName,
                paramString
            );
        }
    }
}