import { _decorator, director, sys } from 'cc';
import { Tools } from './Tools';
import { AnalyticsManager } from './AnalyticsManager';
import { SdkBridge } from './SdkBridge';
import { config } from './Config';
import { GameConst } from './GameConst';
import { MgrGame } from './MgrGame';
import { Adjust } from './Adjust';
import { AppsFlyer } from './AppsFlyer';
import { Firebase } from './Firebase';
import { Facebook } from './Facebook';
import { Loading } from './Loading';
import { GlobalEvent } from './Events';
import { MgrFBAnalytics } from './MgrFBAnalytics';

const { ccclass } = _decorator;

@ccclass('AdsManager')
export class AdsManager {
    private static instance: AdsManager;
    public static INTERSTITIAL_CD_S: number = GameConst.INTERSTITIAL_CD_S;

    private recentAdTime: Date;
    private _isInAdReward: boolean = false;
    private _isInterstitial: boolean = false;
    private _showedInterstitial: boolean = false;

    private readonly _BannerCnt: string = '_BannerCnt';
    private readonly _InterstitialCnt: string = '_InterstitialCnt';
    private readonly _RewardedVideoCnt: string = '_RewardedVideoCnt';

    constructor() {
        this.recentAdTime = new Date(Tools.GetNowTime());
    }

    public static getInstance(): AdsManager {
        if (!AdsManager.instance) {
            AdsManager.instance = new AdsManager();
        }
        return AdsManager.instance;
    }

    public async showRewardedVideo(params: {
        AdsType: string;
        OpenUi: string;
        onBegin?: () => void;
        onCancel?: () => void;
        onSucceed?: () => void;
        onFail?: () => void;
    }): Promise<void> {
        AnalyticsManager.getInstance().reportRewardVideoButtonClicked(params.AdsType, params.OpenUi);

        if (!SdkBridge.isRewardVideoAvailable()) {
            SdkBridge.preloadVideo();
            params.onFail?.();
            return;
        }

        const callbackParams = {
            AdsType: params.AdsType,
            OpenUi: params.OpenUi,
            onBegin: () => {
                AnalyticsManager.getInstance().reportRewardVideoStarted(params.AdsType, params.OpenUi);
                params.onBegin?.();
            },
            onCancel: () => {
                params.onCancel?.();
                this._isInAdReward = false;
            },
            onSucceed: () => {
                this._addRewardedVideoTime();
                this._isInAdReward = false;
                params.onSucceed?.();
                AnalyticsManager.getInstance().reportRewardVideoFullyWatched(params.AdsType, params.OpenUi);
                AnalyticsManager.getInstance().incUserProperty({ CK_AdsNum: 1 });

                const rewardTimes = this.getRewardedVideoTimes();
                Adjust.sendEventAdRewardAD(rewardTimes);
                AppsFlyer.reportReward(rewardTimes);
                Firebase.reportReward(rewardTimes);
                Facebook.reportReward(rewardTimes);
                MgrFBAnalytics.Instance.addRewardCount(1);
            },
            onFail: () => {
                this._isInAdReward = false;
                params.onFail?.();
            }
        };

        this._isInAdReward = true;
        await SdkBridge.showVideo(callbackParams);
    }

    public showInterstitialIfCooldown(params: {
        AdsType: string;
        OpenUi: string;
        closeCallback?: () => void;
        showCallback?: () => void;
        errCallback?: () => void;
    }): boolean {
        if (this._isInterstitialCooldown()) {
            if (MgrGame.Instance.gameData.maxLv < GameConst.INTERSTITIAL_Level) {
                params.errCallback?.();
                return false;
            }
            this.showInterstitial(params);
            return true;
        }
        params.errCallback?.();
        return false;
    }

    public showInterstitialWithoutCooldown(params: {
        AdsType: string;
        OpenUi: string;
        closeCallback?: () => void;
        showCallback?: () => void;
        errCallback?: () => void;
    }): boolean {
        if (MgrGame.Instance.gameData.maxLv < GameConst.INTERSTITIAL_Level) {
            params.errCallback?.();
            return false;
        }
        this.showInterstitial(params);
        return true;
    }

    public showInterstitial(params: {
        AdsType: string;
        OpenUi: string;
        closeCallback?: () => void;
        showCallback?: () => void;
        errCallback?: () => void;
    }): void {
        if (this._isInterstitial) {
            params.errCallback?.();
            return;
        }

        if (this._isInAdReward) {
            params.errCallback?.();
            return;
        }

        if (!SdkBridge.isInterstitialAvailable()) {
            SdkBridge.preloadInterstitial();
            params.errCallback?.();
            return;
        }

        const callbackParams = {
            AdsType: params.AdsType,
            OpenUi: params.OpenUi,
            closeCallback: () => {
                this._isInterstitial = false;
                Loading.close();
                this._addInterstitialTime();
                this._showedInterstitial = true;

                const interstitialTimes = this.getInterstitialTimes();
                AnalyticsManager.getInstance().reprotInterstitial(params.OpenUi, interstitialTimes);
                AppsFlyer.reportInsertion(interstitialTimes);
                Firebase.reportInsertion(interstitialTimes);
                Facebook.reportInsertion(interstitialTimes);
                MgrFBAnalytics.Instance.addInterstitialCount(1);
                params.closeCallback?.();
                director.emit(GlobalEvent.GameShowInterstitial);
            },
            showCallback: () => {
                params.showCallback?.();
                this._resetRecentAdTime();
                AnalyticsManager.getInstance().incUserProperty({ CK_AdsInterNum: 1 });
            },
            errCallback: () => {
                this._isInterstitial = false;
                Loading.close();
                params.errCallback?.();
            }
        };

        AnalyticsManager.getInstance().reportInterstitialReady({
            InAds_OpenUI: params.OpenUi,
            Level_Id: MgrGame.Instance.gameData.curLv
        });

        Loading.open();
        this._isInterstitial = true;
        SdkBridge.showInterstitial(callbackParams);
    }

    public showBanner(params: {
        OpenUi: string;
        showCallback?: () => void;
    }): void {
        const callbackParams = {
            OpenUi: params.OpenUi,
            showCallback: () => {
                this._addBannerTime();
                const bannerTimes = this.getBannerTimes();
                AnalyticsManager.getInstance().reprotBanner(bannerTimes);
                AppsFlyer.reportBanner(bannerTimes);
                Firebase.reportBanner(bannerTimes);
                Facebook.reportBanner(bannerTimes);
                params.showCallback?.();
            }
        };
        SdkBridge.showBanner(callbackParams);
    }

    public hideBanner(): void {
        SdkBridge.hideBanner();
    }

    public share(params: any): void {
        SdkBridge.shareAsync(params);
    }

    public getRewardedVideoTimes(): number {
        const count = sys.localStorage.getItem(`${config.gameName}${this._RewardedVideoCnt}`) || '0';
        return Number(count);
    }

    private _addRewardedVideoTime(): void {
        let count = this.getRewardedVideoTimes();
        count++;
        sys.localStorage.setItem(`${config.gameName}${this._RewardedVideoCnt}`, count.toString());
    }

    public getInterstitialTimes(): number {
        const count = sys.localStorage.getItem(`${config.gameName}${this._InterstitialCnt}`) || '0';
        return Number(count);
    }

    private _addInterstitialTime(): void {
        let count = this.getInterstitialTimes();
        count++;
        sys.localStorage.setItem(`${config.gameName}${this._InterstitialCnt}`, count.toString());
    }

    public getBannerTimes(): number {
        const count = sys.localStorage.getItem(`${config.gameName}${this._BannerCnt}`) || '0';
        return Number(count);
    }

    private _addBannerTime(): void {
        let count = this.getBannerTimes();
        count++;
        sys.localStorage.setItem(`${config.gameName}${this._BannerCnt}`, count.toString());
    }

    private _resetRecentAdTime(): void {
        this.recentAdTime = new Date(Tools.GetNowTime());
    }

    private _isInterstitialCooldown(): boolean {
        const currentTime = Tools.GetNowTime();
        const lastAdTime = this.recentAdTime.getTime();
        const cooldown = this._getInterstitialCd();

        return cooldown !== -1 && (currentTime - lastAdTime) / 1000 >= cooldown;
    }

    private _getInterstitialCd(): number {
        return GameConst.INTERSTITIAL_CD_S || AdsManager.INTERSTITIAL_CD_S;
    }

    public get isInAdReward(): boolean {
        return this._isInAdReward;
    }

    public get isInAdInterstitial(): boolean {
        return this._isInterstitial;
    }

    public get showedInterstitial(): boolean {
        return this._showedInterstitial;
    }

    public set showedInterstitial(value: boolean) {
        this._showedInterstitial = value;
    }
}