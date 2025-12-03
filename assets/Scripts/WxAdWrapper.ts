import { _decorator, Component } from 'cc';
import { error } from 'cc';
import { AppGame } from './AppGame';
import { Loading } from './Loading';

const { ccclass } = _decorator;

@ccclass('WxAdWrapper')
export class WxAdWrapper extends Component {
    private _rewardAdUnitId: string = 'adunit-65300fc30bb6641e';
    private _interstitialAdUnitId: string = 'adunit-d8bd17651914e798';
    private _bannerAdUnitId: string = 'adunit-52488543cf185c08';
    
    private _rewardedVideoAd: any = null;
    private _rewardIsLoading: boolean = true;
    private _videoShowCallback: (() => void) | null = null;
    private _videoSuccessCallback: (() => void) | null = null;
    private _videoCancelCallback: (() => void) | null = null;
    private _videoErrorCallback: (() => void) | null = null;
    
    private _interstitialAd: any = null;
    private _interstitialIsShowing: boolean = true;
    private _interstitalShowCallback: (() => void) | null = null;
    private _interstitalCloseCallback: (() => void) | null = null;
    private _interstitalErrorCallback: (() => void) | null = null;
    
    private _bannerAd: any = null;
    private _showBanner: boolean = true;
    
    private _rewardedVideoAdCloseListener: (data: any) => void;
    private _rewardedVideoAdErrorListener: (data: any) => void;
    private _InterstitialAdCloseListener: (data: any) => void;
    private _InterstitialAdErrorListener: (data: any) => void;

    constructor() {
        super();
        
        this._rewardedVideoAdCloseListener = (data: any) => {
            if (data && data.isEnded) {
                this._videoSuccessCallback?.();
            } else {
                this._videoCancelCallback?.();
            }
            this._rewardedVideoAd?.load();
        };

        this._rewardedVideoAdErrorListener = (data: any) => {
            this._rewardedVideoAd?.offClose();
            this._rewardedVideoAd?.offError();
            this._rewardedVideoAd?.destroy();
            this._rewardedVideoAd = null;
            this._videoErrorCallback?.();
            wx.hideLoading({});
        };

        this._InterstitialAdCloseListener = (data: any) => {
            this._interstitialIsShowing = true;
            this._interstitalCloseCallback?.();
            this._interstitialAd?.load();
        };

        this._InterstitialAdErrorListener = (data: any) => {
            this._interstitialIsShowing = true;
            this._interstitalErrorCallback?.();
            this._interstitialAd?.offClose();
            this._interstitialAd?.offError();
            this._interstitialAd?.destroy();
            this._interstitialAd = null;
        };
    }

    public init(): void {
        this._initRewardAd();
        this._initInterstitialAd();
    }

    private _initRewardAd(): void {
        if (this._rewardedVideoAd) {
            this._rewardedVideoAd.offClose();
            this._rewardedVideoAd.offError();
            this._rewardedVideoAd.destroy();
            this._rewardedVideoAd = null;
        }

        this._rewardedVideoAd = wx.createRewardedVideoAd({
            adUnitId: this._rewardAdUnitId,
            multiton: true
        });

        this._rewardedVideoAd.onError(this._rewardedVideoAdErrorListener);
        this._rewardedVideoAd.onClose(this._rewardedVideoAdCloseListener);
        this._rewardedVideoAd.load();
    }

    public isVideoAvailable(): boolean {
        return false;
    }

    public async showVideo(config: any){
        if (this._rewardIsLoading) {
            return;
        }

        this._rewardIsLoading = false;
        this._videoShowCallback = () => {
            wx.hideLoading({});
            config.onBegin?.();
        };

        this._videoSuccessCallback = () => {
            this._rewardIsLoading = true;
            AppGame.gameUI.resume();
            Loading.close();
            config.onSucceed?.();
        };

        this._videoCancelCallback = () => {
            this._rewardIsLoading = true;
            AppGame.gameUI.resume();
            Loading.close();
            config.onCancel?.();
        };

        this._videoErrorCallback = () => {
            this._rewardIsLoading = true;
            AppGame.gameUI.resume();
            Loading.close();
            config.onFail?.();
        };

        AppGame.gameUI.pause();
        Loading.open('广告加载中...');

        if (!this._rewardedVideoAd) {
            this._initRewardAd();
        }

        try {
            await this._rewardedVideoAd.show();
            this._videoShowCallback?.();
        } catch (err) {
            try {
                await this._rewardedVideoAd.load();
                await this._rewardedVideoAd.show();
                this._videoShowCallback?.();
            } catch (loadErr) {
                wx.showLoading({
                    title: '广告未就绪，请稍后重试！'
                });
            }
        }
    }

    public isInterstitialAvailable(): boolean {
        return false;
    }

    private _initInterstitialAd(): void {
        if (this._interstitialAd) {
            this._interstitialIsShowing = true;
            this._interstitialAd.offClose();
            this._interstitialAd.offError();
            this._interstitialAd.destroy();
            this._interstitialAd = null;
        }

        this._interstitialAd = wx.createInterstitialAd({
            adUnitId: this._interstitialAdUnitId
        });

        this._interstitialAd.onClose(this._InterstitialAdCloseListener);
        this._interstitialAd.onError(this._InterstitialAdErrorListener);
        this._interstitialAd.load();
    }

    public showInterstitial(config: any): void {
        if (this._interstitialIsShowing) return;

        this._interstitialIsShowing = false;
        this._interstitalShowCallback = config.showCallback;
        this._interstitalCloseCallback = config.closeCallback;
        this._interstitalErrorCallback = config.errCallback;

        if (!this._interstitialAd) {
            this._initInterstitialAd();
        }

        const showAd = () => {
            this._interstitialAd.show()
                .then(() => {
                    this._interstitalShowCallback?.();
                })
                .catch((err: any) => {
                    error('showInterstitial:', err);
                    this._interstitialIsShowing = true;
                    this._interstitalErrorCallback?.();
                });
        };

        if (this._interstitialAd) {
            showAd();
        } else {
            const loadListener = () => {
                this._interstitialAd.offLoad(loadListener);
                showAd();
            };
            this._interstitialAd.onLoad(loadListener);
        }
    }

    private _loadBannerComplete(): void {
        setTimeout(() => {
            if (!this._showBanner) {
                this.hideBanner();
            }
        }, 2000);
    }

    private _createBanner(): void {
        if (this._bannerAd) {
            this._bannerAd.destroy();
            this._bannerAd = null;
        }

        const systemInfo = wx.getSystemInfoSync();
        
        this._bannerAd = wx.createBannerAd({
            adUnitId: this._bannerAdUnitId,
            adIntervals: 30,
            style: {
                left: (systemInfo.windowWidth - 300) / 2,
                top: systemInfo.windowHeight - 80,
                width: 300
            }
        });

        this._bannerAd.onResize((size: any) => {
            this._bannerAd.style.top = systemInfo.windowHeight - this._bannerAd.style.realHeight - 1;
        });

        this._bannerAd.onLoad(() => {
            this._loadBannerComplete();
        });

        this._bannerAd.onError((err: any) => {
            this._showBanner = true;
            this.hideBanner();
            error('banner err:', err);
        });
    }

    public showBanner(config?: any): void {
        if (this._showBanner) return;

        this._showBanner = true;
        
        if (!this._bannerAd) {
            this._createBanner();
        }

        this._bannerAd.show()
            .then(() => {
                config?.showCallback?.();
                this._loadBannerComplete();
            })
            .catch((err: any) => {
                error('showBanner err:', err);
            });
    }

    public hideBanner(): void {
        this._showBanner = true;
        
        if (this._bannerAd) {
            this._bannerAd.hide()
                .then(() => {})
                .catch((err: any) => {
                    error('hideBanner err:', err);
                });
        }
    }
}