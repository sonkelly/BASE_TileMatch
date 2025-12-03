import { _decorator, native, game, cclegacy } from 'cc';
import { AndroidAdWrapper } from './AndroidAdWrapper';
import { adAmountMgr } from './AdAmountManager';
import { IAPMgr } from './IAPMgr';

const { ccclass, property } = _decorator;

@ccclass('AndroidSdkWrapper')
export class AndroidSdkWrapper {
    private static instance: AndroidSdkWrapper = new AndroidSdkWrapper();
    private adMgr: AndroidAdWrapper | null = null;

    public static getInstance(): AndroidSdkWrapper {
        return AndroidSdkWrapper.instance;
    }

    public init(): void {
        this.adMgr = new AndroidAdWrapper();
        this.adMgr.init('com/cocos/game/SdkBrigde');
        adAmountMgr.init();

        native.bridge.onNative = (event: string, data: any) => {
            switch (event) {
                case 'bannerAd_show':
                    this.adMgr!.bannerShow();
                    break;
                case 'rewardAd_loadfailed':
                    this.adMgr!.rewardAdFailed();
                    break;
                case 'rewardAd_start':
                    this.adMgr!.rewardAdStart();
                    break;
                case 'rewardAd_complete':
                    this.adMgr!.rewardAdComplete(data === 'true');
                    break;
                case 'interstitialAd_failed':
                    this.adMgr!.showInterstitialFailed();
                    break;
                case 'interstitialAd_start':
                    this.adMgr!.showInterstitialStart();
                    break;
                case 'interstitialAd_close':
                    this.adMgr!.showInterstitialClose();
                    break;
                case 'adPrice':
                    adAmountMgr.addAdAmount(data);
                    break;
                case 'onQueryProductDetailsCallBack':
                    IAPMgr.Instance.onQueryProductDetailsCallBack(data);
                    break;
                case 'onRestorePurchasesCallBack':
                    IAPMgr.Instance.onRestorePurchasesCallBack(data);
                    break;
                case 'onBuyProductDetailsCallBack':
                    IAPMgr.Instance.onBuyProductDetailsCallBack(data);
                    break;
                case 'onValidatePurchase':
                    IAPMgr.Instance.onValidatePurchase(data);
                    break;
                case 'onConsumablePurchaseCallBack':
                    IAPMgr.Instance.onConsumablePurchaseCallBack(data);
                    break;
                case 'onNoConsumablePurchaseCallBack':
                    IAPMgr.Instance.onNoConsumablePurchaseCallBack(data);
                    break;
                case 'onSubscriptionPurchaseCallBack':
                    IAPMgr.Instance.onSubscriptionPurchaseCallBack(data);
                    break;
            }
        };
    }

    public vibrate(duration: number): void {
        jsb.device.vibrate(duration);
    }

    public preloadVideo(): void {
        native.reflection.callStaticMethod('com/cocos/game/SdkBrigde', 'preloadVideo', '()V');
    }

    public preloadInterstitial(): void {
        native.reflection.callStaticMethod('com/cocos/game/SdkBrigde', 'preloadInterstitial', '()V');
    }

    public getVersion(): string {
        return native.reflection.callStaticMethod('com/cocos/game/SdkBrigde', 'getNativeVersion', '()Ljava/lang/String;');
    }

    public appRevive(): void {
        native.reflection.callStaticMethod('com/cocos/game/SdkBrigde', 'reviveInApp', '()V');
    }

    public checkAppUpdate(): void {
        native.reflection.callStaticMethod('com/cocos/game/SdkBrigde', 'checkAppUpdate', '()V');
    }

    public login(options: { onSucceed?: () => void }): void {
        options.onSucceed?.();
    }

    public async shareAsync(options: any): Promise<void> {
        return Promise.resolve();
    }

    public async inviteAsync(options: any): Promise<void> {
        return Promise.resolve();
    }

    public isVideoAvailable(): boolean {
        return this.adMgr!.isVideoAvailable();
    }

    public showVideo(options: any): boolean {
        return this.adMgr!.showVideo(options);
    }

    public isInterstitialAvailable(): boolean {
        return this.adMgr!.isInterstitialAvailable();
    }

    public showInterstitial(options: any): void {
        this.adMgr!.showInterstitial(options);
    }

    public showBanner(options: any): void {
        this.adMgr!.showBanner(options);
    }

    public hideBanner(): void {
        this.adMgr!.hideBanner();
    }

    public async getDataAsync(options: any): Promise<any> {
        return Promise.resolve({});
    }

    public async setDataAsync(options: any): Promise<void> {
        return Promise.resolve();
    }

    public async clearDataAsync(options: any): Promise<void> {
        return Promise.resolve();
    }

    public quitGame(): void {
        game.end();
    }
}