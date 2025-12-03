// NativeBridge.ts
import { _decorator, sys, native } from 'cc';
import { Singleton } from './Singleton';
import { AdsManager } from './AdsManager';
import { SdkBridge } from './SdkBridge';
import { AudioPlayer } from './AudioPlayer';
import { MgrShop } from './MgrShop';

const { ccclass } = _decorator;

const OLD_IPHONE_MODELS = ['iPhone1,1', 'iPhone1,2', 'iPhone2,1', 'iPhone3,1', 'iPhone3,3', 'iPhone4,1', 'iPhone5,1', 'iPhone5,2', 'iPhone5,3', 'iPhone5,4', 'iPhone6,1', 'iPhone6,2'];
const MID_IPHONE_MODELS = ['iPhone6', 'iPhone7', 'iPhone8'];
const RECENT_IPHONE_MODELS = ['iPhone9', 'iPhone10'];
const LATEST_IPHONE_MODELS = ['iPhone11', 'iPhone12', 'iPhone13', 'iPhone14', 'iPhone15'];
const NETWORK_UTILS_CLASS = 'com/cocos/game/NetworkUtils';

@ccclass('NativeBridge')
export class NativeBridge extends Singleton {
    private _adHandler: any = undefined;
    private _purchaseHandler: any = undefined;
    private _deviceBenchmarkLevel: number | null = null;

    // Thuộc tính static Instance để truy cập singleton
    public static get Instance(): NativeBridge {
        return this.getInstance<NativeBridge>();
    }

    public getBenchmarkLevel(): number {
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            const systemInfo = wx.getSystemInfoSync();
            
            if (sys.os === sys.OS.IOS) {
                const model = systemInfo.model;
                
                for (const modelName of LATEST_IPHONE_MODELS) {
                    if (model.includes(modelName)) {
                        return 30;
                    }
                }
                
                for (const modelName of RECENT_IPHONE_MODELS) {
                    if (model.includes(modelName)) {
                        return 20;
                    }
                }
                
                for (const modelName of MID_IPHONE_MODELS) {
                    if (model.includes(modelName)) {
                        return 10;
                    }
                }
                
                for (const modelName of OLD_IPHONE_MODELS) {
                    if (model.includes(modelName)) {
                        return 5;
                    }
                }
                
                return -1;
            }
            
            return systemInfo.benchmarkLevel;
        }
        
        return 50;
    }

    public checkIsLowPhone(): boolean {
        if (this._deviceBenchmarkLevel === null) {
            this._deviceBenchmarkLevel = this.getBenchmarkLevel();
        }
        return this._deviceBenchmarkLevel < 20;
    }

    public vibrate(duration: number): void {
        if (AudioPlayer.Instance.vibrationSwitch) {
            SdkBridge.vibrate(duration);
        }
    }

    public requestAd(callback: any): Promise<boolean> {
        return AdsManager.getInstance().showRewardedVideo(callback);
    }

    public showInterstitialIfCooldown(callback: any): boolean {
        if (MgrShop.Instance.isBuyNoAd()) {
            callback?.errCallback?.();
            return false;
        }
        return AdsManager.getInstance().showInterstitialIfCooldown(callback);
    }

    public showInterstitialWithoutCooldown(callback: any): boolean {
        if (MgrShop.Instance.isBuyNoAd()) {
            callback?.errCallback?.();
            return false;
        }
        return AdsManager.getInstance().showInterstitialWithoutCooldown(callback);
    }

    public showBanner(callback: any): boolean {
        if (MgrShop.Instance.isBuyNoAd()) {
            return false;
        }
        return AdsManager.getInstance().showBanner(callback);
    }

    public hideBanner(): boolean {
        if (MgrShop.Instance.isBuyNoAd()) {
            return false;
        }
        return AdsManager.getInstance().hideBanner();
    }

    public getNetworkType(): number {
        if (sys.isNative) {
            switch (sys.platform) {
                case sys.Platform.ANDROID:
                    return native.reflection.callStaticMethod(NETWORK_UTILS_CLASS, 'getConnectedNetworkType', '()I');
            }
        }
        return 0;
    }

    public openWifiSetting(): number {
        if (sys.isNative) {
            switch (sys.platform) {
                case sys.Platform.ANDROID:
                    native.reflection.callStaticMethod(NETWORK_UTILS_CLASS, 'openWifiSetting', '()V');
                    break;
            }
        }
        return 0;
    }
}