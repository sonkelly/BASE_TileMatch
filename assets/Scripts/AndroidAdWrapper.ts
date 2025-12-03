import { _decorator, Component, native, cclegacy } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AndroidAdWrapper')
export class AndroidAdWrapper extends Component {
    private _bannerOption: any = null;
    private _videoOption: any = null;
    private _interstitialOption: any = null;
    private _apiUrl: string = 'com/cocos/game/SdkBrigde';

    public init(fb: any): void {}

    public isVideoAvailable(): boolean {
        return native.reflection.callStaticMethod(this._apiUrl, 'rewardAdAvailable', '()Z');
    }

    public showVideo(fb: any): Promise<void> {
        this._videoOption = fb;
        return new Promise((resolve, reject) => {
            native.reflection.callStaticMethod(this._apiUrl, 'showAd', '(I)V', 0x3);
            resolve();
        });
    }

    public rewardAdFailed(): void {
        if (this._videoOption && this._videoOption.onFail) {
            this._videoOption.onFail.call(this._videoOption);
        }
    }

    public rewardAdStart(): void {
        if (this._videoOption && this._videoOption.onBegin) {
            this._videoOption.onBegin.call(this._videoOption);
        }
    }

    public rewardAdComplete(eY: boolean): void {
        if (!this._videoOption) return;
        
        if (eY) {
            if (this._videoOption.onSucceed) {
                this._videoOption.onSucceed.call(this._videoOption);
            }
        } else {
            if (this._videoOption.onCancel) {
                this._videoOption.onCancel.call(this._videoOption);
            }
        }
    }

    public isInterstitialAvailable(): boolean {
        return native.reflection.callStaticMethod(this._apiUrl, 'interstitialAvailable', '()Z');
    }

    public showInterstitial(fb: any): void {
        this._interstitialOption = fb;
        native.reflection.callStaticMethod(this._apiUrl, 'showAd', '(I)V', 0x2);
    }

    public showInterstitialFailed(): void {
        if (this._interstitialOption && this._interstitialOption.errCallback) {
            this._interstitialOption.errCallback.call(this._interstitialOption);
        }
    }

    public showInterstitialStart(): void {
        if (this._interstitialOption && this._interstitialOption.showCallback) {
            this._interstitialOption.showCallback.call(this._interstitialOption);
        }
    }

    public showInterstitialClose(): void {
        if (this._interstitialOption && this._interstitialOption.closeCallback) {
            this._interstitialOption.closeCallback.call(this._interstitialOption);
        }
    }

    public showBanner(fb: any): void {
        this._bannerOption = fb;
        native.reflection.callStaticMethod(this._apiUrl, 'showAd', '(I)V', 0x1);
    }

    public bannerShow(): void {
        if (this._bannerOption && this._bannerOption.showCallback) {
            this._bannerOption.showCallback.call(this._bannerOption);
        }
    }

    public hideBanner(): void {
        native.reflection.callStaticMethod(this._apiUrl, 'hideAd', '(I)V', 0x1);
    }
}