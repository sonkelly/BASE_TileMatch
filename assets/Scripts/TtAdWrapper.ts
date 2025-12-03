import { _decorator, Component } from 'cc';
import { AppGame } from './AppGame';
import { Loading } from './Loading';

const { ccclass } = _decorator;

@ccclass('TtAdWrapper')
export class TtAdWrapper extends Component {
    private _rewardAdUnitId: string = 'adunit-4ac2234738c8df9c';
    private _interstitialAdUnitId: string = 'adunit-4141e2e8cfac7827';
    private _bannerAdUnitId: string = 'adunit-501e9f690cc2a38d';
    
    private _rewardedVideoAd: any = null;
    private _rewardIsLoading: boolean = false;
    private _videoShowCallback: (() => void) | null = null;
    private _videoSuccessCallback: (() => void) | null = null;
    private _videoCancelCallback: (() => void) | null = null;
    private _videoErrorCallback: (() => void) | null = null;
    
    private _interstitialAd: any = null;
    private _interstitialIsShowing: boolean = false;
    private _interstitalShowCallback: (() => void) | null = null;
    private _interstitalCloseCallback: (() => void) | null = null;
    private _interstitalErrorCallback: (() => void) | null = null;
    
    private _bannerAd: any = null;
    private _showBanner: boolean = false;
    
    private _rewardedVideoAdCloseListener: (result: any) => void;
    private _rewardedVideoAdErrorListener: (error: any) => void;
    private _InterstitialAdCloseListener: (result: any) => void;
    private _InterstitialAdErrorListener: (error: any) => void;

    constructor() {
        super();
        
        this._rewardedVideoAdCloseListener = (result: any) => {
            if (result && result.isEnded) {
                this._videoSuccessCallback?.();
            } else {
                this._videoCancelCallback?.();
            }
            this._rewardedVideoAd?.load();
        };
        
        this._rewardedVideoAdErrorListener = (error: any) => {
            this._rewardedVideoAd?.offClose(this._rewardedVideoAdCloseListener);
            this._rewardedVideoAd?.offError(this._rewardedVideoAdErrorListener);
            this._rewardedVideoAd?.destroy();
            this._rewardedVideoAd = null;
            this._videoErrorCallback?.();
            tt.hideLoading({});
        };
        
        this._InterstitialAdCloseListener = (result: any) => {
            this._interstitialIsShowing = false;
            this._interstitalCloseCallback?.();
            this._interstitialAd?.load();
        };
        
        this._InterstitialAdErrorListener = (error: any) => {
            this._interstitialIsShowing = false;
            this._interstitalErrorCallback?.();
            this._interstitialAd?.offClose(this._InterstitialAdCloseListener);
            this._interstitialAd?.offError(this._InterstitialAdErrorListener);
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
            this._rewardedVideoAd.offClose(this._rewardedVideoAdCloseListener);
            this._rewardedVideoAd.offError(this._rewardedVideoAdErrorListener);
            this._rewardedVideoAd.destroy();
            this._rewardedVideoAd = null;
        }
        
        this._rewardedVideoAd = tt.createRewardedVideoAd({
            adUnitId: this._rewardAdUnitId,
            shareInspire: true
        });
        
        this._rewardedVideoAd.onClose(this._rewardedVideoAdCloseListener);
        this._rewardedVideoAd.onError(this._rewardedVideoAdErrorListener);
        this._rewardedVideoAd.load();
    }

    public isVideoAvailable(): boolean {
        return true;
    }

    public async showVideo(params: any){
        if (this._rewardIsLoading) {
            return;
        }
        
        this._rewardIsLoading = true;
        
        this._videoShowCallback = () => {
            tt.hideLoading({});
            params.onBegin?.();
        };
        
        this._videoSuccessCallback = () => {
            this._rewardIsLoading = false;
            AppGame.gameUI.resume();
            Loading.close();
            params.onSucceed?.();
        };
        
        this._videoCancelCallback = () => {
            this._rewardIsLoading = false;
            AppGame.gameUI.resume();
            Loading.close();
            params.onCancel?.();
        };
        
        this._videoErrorCallback = () => {
            this._rewardIsLoading = false;
            AppGame.gameUI.resume();
            Loading.close();
            params.onFail?.();
        };
        
        AppGame.gameUI.pause();
        Loading.open('广告加载中...');
        
        if (!this._rewardedVideoAd) {
            this._initRewardAd();
        }
        
        try {
            await this._rewardedVideoAd.show();
            this._videoShowCallback?.();
        } catch (error) {
            try {
                await this._rewardedVideoAd.load();
                await this._rewardedVideoAd.show();
                this._videoShowCallback?.();
            } catch {
                tt.showLoading({
                    title: '广告未就绪，请稍后重试！'
                });
            }
        }
    }

    public isInterstitialAvailable(): boolean {
        return true;
    }

    private _initInterstitialAd(): void {
        if (this._interstitialAd) {
            this._interstitialIsShowing = false;
            this._interstitialAd.offClose(this._InterstitialAdCloseListener);
            this._interstitialAd.offError(this._InterstitialAdErrorListener);
            this._interstitialAd.destroy();
            this._interstitialAd = null;
        }
        
        this._interstitialAd = tt.createInterstitialAd({
            adUnitId: this._interstitialAdUnitId
        });
        
        this._interstitialAd.onClose(this._InterstitialAdCloseListener);
        this._interstitialAd.onError(this._InterstitialAdErrorListener);
        this._interstitialAd.load();
    }

    public showInterstitial(params: any): void {
        if (this._interstitialIsShowing) {
            return;
        }
        
        this._interstitialIsShowing = true;
        this._interstitalShowCallback = params.showCallback;
        this._interstitalCloseCallback = params.closeCallback;
        this._interstitalErrorCallback = params.errCallback;
        
        if (!this._interstitialAd) {
            this._initInterstitialAd();
        }
        
        const showAd = async (): Promise<void> => {
            try {
                await this._interstitialAd.show();
                this._interstitalShowCallback?.();
            } catch (error) {
                console.error('showInterstitial:', error);
                this._interstitialIsShowing = false;
                this._interstitalErrorCallback?.();
            }
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
        
        const systemInfo = tt.getSystemInfoSync();
        
        this._bannerAd = tt.createBannerAd({
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
        
        this._bannerAd.onError((error: any) => {
            this._showBanner = false;
            this.hideBanner();
            console.error('banner err:', error);
        });
    }

    public showBanner(params?: any): void {
        if (this._showBanner) {
            return;
        }
        
        this._showBanner = true;
        
        if (!this._bannerAd) {
            this._createBanner();
        }
        
        this._bannerAd.show()
            .then(() => {
                params?.showCallback?.();
                this._loadBannerComplete();
            })
            .catch((error: any) => {
                console.error('showBanner err:', error);
            });
    }

    public hideBanner(): void {
        this._showBanner = false;
        
        if (this._bannerAd) {
            this._bannerAd.hide()
                .then(() => {})
                .catch((error: any) => {
                    console.error('hideBanner err:', error);
                });
        }
    }
}