import { error as ccError } from 'cc';
import {Toast} from './Toast';
import {Language} from './Language';

enum AdType {
    INVALID = 0,
    INTERSTITIAL = 1,
    REWARDED_VIDEO = 2,
}

export class FbInstantAdWrapper {
    static kMaxVideoInstance = 1;
    static kMaxInterstitialInstance = 1;

    readyVideos: any[] = [];
    loadingVideo: any = null;
    readyInterstitials: any[] = [];
    loadingInterstitial: any = null;
    cfg = {
        rewardedVideoPlacementId: '123_123',
        interstitialPlacementId: '123_123',
        bannerPlacementId: '123_123',
    };

    init() {
        this._preloadAds();
    }

    _preloadAds() {
        if (this._isRewardedVideoSupported()) {
            for (let i = 0; i < FbInstantAdWrapper.kMaxVideoInstance; i++) {
                this.preloadVideo();
            }
        }
        if (this._isInterstitialSupported()) {
            for (let i = 0; i < FbInstantAdWrapper.kMaxInterstitialInstance; i++) {
                this.preloadInterstitial();
            }
        }
    }

    preloadVideo() {
        if (this.readyVideos.length >= FbInstantAdWrapper.kMaxVideoInstance || this.loadingVideo) {
            return;
        }

        const placement = this.cfg.rewardedVideoPlacementId;
        if (!window.FBInstant) return;

        FBInstant.getRewardedVideoAsync(placement)
            .then((video: any) => {
                this.loadingVideo = video;
                this.loadingVideo
                    .loadAsync()
                    .then(() => {
                        this.readyVideos.push(this.loadingVideo);
                        this.loadingVideo = null;
                    })
                    .catch((err: any) => {
                        console.log('Fb reward load fail reason:', err);
                        if (this.loadingVideo) {
                            this._handleAdsNoFill(this.loadingVideo, AdType.REWARDED_VIDEO, 0);
                        }
                    });
            })
            .catch((err: any) => {
                console.log('FBInstant.getRewardedVideoAsync err:', err);
            });
    }

    async preloadInterstitial() {
        if (!window.FBInstant) return;

        const placement = this.cfg.interstitialPlacementId;
        try {
            if (this.readyInterstitials.length >= FbInstantAdWrapper.kMaxInterstitialInstance) return;
            if (this.loadingInterstitial) return;

            this.loadingInterstitial = await FBInstant.getInterstitialAdAsync(placement);
            if (this.loadingInterstitial) {
                await this.loadingInterstitial.loadAsync();
                this.readyInterstitials.push(this.loadingInterstitial);
                this.loadingInterstitial = null;
            }
        } catch (err) {
            ccError('FBInstant.getInterstitialAdAsync err:', err);
            if (this.loadingInterstitial) {
                this._handleAdsNoFill(this.loadingInterstitial, AdType.INTERSTITIAL, 0);
            }
        }
    }

    _handleAdsNoFill(ad: any, type: AdType, retry: number) {
        // If retried too many times, clear loading and give up
        if (retry >= 3) {
            if (type === AdType.INTERSTITIAL) {
                this.loadingInterstitial = null;
            } else if (type === AdType.REWARDED_VIDEO) {
                this.loadingVideo = null;
            }
            return;
        }

        ad.loadAsync()
            .then(() => {
                if (type === AdType.INTERSTITIAL) {
                    this.readyInterstitials.push(ad);
                    this.loadingInterstitial = null;
                } else if (type === AdType.REWARDED_VIDEO) {
                    this.readyVideos.push(ad);
                    this.loadingVideo = null;
                }
            })
            .catch((err: any) => {
                console.error('ad failed to preload: ' + (err && err.message ? err.message : err));
                setTimeout(() => {
                    if (ad) {
                        this._handleAdsNoFill(ad, type, retry + 1);
                    }
                }, 30000);
            });
    }

    _isRewardedVideoSupported(): boolean {
        return window.FBInstant ? FBInstant.getSupportedAPIs().includes('getRewardedVideoAsync') : false;
    }

    _isInterstitialSupported(): boolean {
        return window.FBInstant ? FBInstant.getSupportedAPIs().includes('getInterstitialAdAsync') : false;
    }

    isVideoAvailable(): boolean {
        return this.readyVideos.length > 0;
    }

    showVideo(callbacks?: { onBegin?: () => void; onSucceed?: () => void; onFail?: () => void; }): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const failHandler = () => {
                if (callbacks && callbacks.onFail) callbacks.onFail();
                this.preloadVideo();
                reject();
            };

            if (this.isVideoAvailable()) {
                const video = this.readyVideos.shift();
                if (!video) {
                    Toast.error(Language.Instance.getLangByID('ad_not_ready'));
                    return failHandler();
                }

                if (callbacks && callbacks.onBegin) callbacks.onBegin();

                video.showAsync()
                    .then(() => {
                        if (callbacks && callbacks.onSucceed) callbacks.onSucceed();
                        this.preloadVideo();
                        resolve();
                    })
                    .catch((err: any) => {
                        ccError('showVideo failed:', err);
                        if (err && err.code === 'RATE_LIMITED') {
                            this.readyVideos.push(video);
                        }
                        failHandler();
                    });
            } else {
                Toast.error(Language.Instance.getLangByID('ad_not_ready'));
                failHandler();
            }
        });
    }

    isInterstitialReady(): boolean {
        return this.readyInterstitials.length > 0;
    }

    showInterstitial(callbacks?: { showCallback?: () => void; closeCallback?: () => void; errCallback?: () => void; }) {
        const errHandler = () => {
            if (callbacks && callbacks.errCallback) callbacks.errCallback();
            this.preloadInterstitial();
        };

        if (this.isInterstitialReady()) {
            const inter = this.readyInterstitials.shift();
            if (!inter) {
                return errHandler();
            }

            inter.showAsync()
                .then(() => {
                    if (callbacks && callbacks.showCallback) callbacks.showCallback();
                    if (callbacks && callbacks.closeCallback) callbacks.closeCallback();
                    this.preloadInterstitial();
                })
                .catch((err: any) => {
                    ccError('showInterstitial failed:', err);
                    if (err && err.code === 'RATE_LIMITED') {
                        this.readyInterstitials.push(inter);
                    }
                    errHandler();
                });
        } else {
            errHandler();
        }
    }

    showBanner(callbacks?: { showCallback?: () => void; }) {
        const placement = this.cfg.bannerPlacementId;
        if (!window.FBInstant) return;

        FBInstant.loadBannerAdAsync(placement)
            .then(() => {
                if (callbacks && callbacks.showCallback) callbacks.showCallback();
            })
            .catch((err: any) => {
                ccError('showBanner failed: ', err);
            });
    }

    hideBanner() {
        try {
            if (!window.FBInstant) return;
            FBInstant.hideBannerAdAsync();
        } catch (err) {
            ccError('Banner failed to hide: ', err);
        }
    }
}

export default new FbInstantAdWrapper();