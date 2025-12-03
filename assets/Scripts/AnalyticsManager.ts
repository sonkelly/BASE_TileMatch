import { _decorator, cclegacy } from 'cc';
import { ReportEventEnum } from './AdsEvent';
import { AdsManager } from './AdsManager';
import { ReporterBridge } from './ReporterBridge';

const { ccclass } = _decorator;

@ccclass('AnalyticsManager')
export class AnalyticsManager {
    private static _instance: AnalyticsManager = new AnalyticsManager();
    public reportDebug: boolean = false;
    public static gameDataQuerier: any = null;
    public static version: string = '';
    public static isFirstBegin: boolean = false;
    public static gameTime: number = 0;

    public static getInstance(): AnalyticsManager {
        return AnalyticsManager._instance;
    }

    public static setGameDataQuerier(querier: any): void {
        AnalyticsManager.gameDataQuerier = querier;
    }

    public static setVersion(version: string): void {
        AnalyticsManager.version = version;
    }

    public setCommonProperties(): void {
        const version = AnalyticsManager.version;
        this.setOnceUserProperty({
            CK_InstallVersion: version
        });
        this.setUserProperty({
            CK_GameVersion: version
        });
    }

    public reportAdAmount(data: any): void {
        this._reportEvent(ReportEventEnum.Ad_Revenue, data);
    }

    public reportRewardVideoButtonClicked(adsType: string, openUi: string): void {
        const params = {
            AdsType: adsType,
            OpenUi: openUi
        };
        this._reportEvent(ReportEventEnum.Ads_Click, params);
    }

    public reportRewardVideoStarted(adsType: string, openUi: string): void {
        const params = {
            AdsType: adsType,
            OpenUi: openUi
        };
        this._reportEvent(ReportEventEnum.Ads_Suc, params);
    }

    public reportRewardVideoFullyWatched(adsType: string, openUi: string): void {
        const params = {
            AdsType: adsType,
            OpenUi: openUi
        };
        this._reportEvent(ReportEventEnum.Ads_Return, params);
    }

    public reprotInterstitial(openUi: string, times: number): void {
        const params = {
            InAds_OpenUI: openUi,
            InAds_Times: times
        };
        this._reportEvent(ReportEventEnum.Ads_Interstitial, params);
    }

    public reprotBanner(times: number): void {
        const params = {
            bannerAds_Times: times
        };
        this._reportEvent(ReportEventEnum.Ads_Banner, params);
    }

    public reportStartLogin(data: any): void {
        this._reportEvent(ReportEventEnum.Start_Login, data);
    }

    public reportLevelGame(data: any): void {
        this._reportEvent(ReportEventEnum.Leave_Game, data);
    }

    public reportLoadingStart(data: any): void {
        this._reportEvent(ReportEventEnum.Loading_Start, data);
    }

    public reportLoadingFinish(data: any): void {
        this._reportEvent(ReportEventEnum.Loading_Finish, data);
    }

    public reportStartGame(data: any): void {
        this._reportEvent(ReportEventEnum.Start_Game, data);
    }

    public reportLevelStart(data: any): void {
        this._reportEvent(ReportEventEnum.Level_Start, data);
    }

    public reportLevelRevive(data: any): void {
        this._reportEvent(ReportEventEnum.Level_Revive, data);
    }

    public reportLevelVictory(data: any): void {
        this._reportEvent(ReportEventEnum.Level_Victory, data);
    }

    public reportLevelFail(data: any): void {
        this._reportEvent(ReportEventEnum.Level_Fail, data);
    }

    public reportCoinsGet(data: any): void {
        this._reportEvent(ReportEventEnum.Coin_Get, data);
    }

    public reportCoinUse(data: any): void {
        this._reportEvent(ReportEventEnum.Coin_Use, data);
    }

    public reportPropGet(data: any): void {
        this._reportEvent(ReportEventEnum.Prop_Get, data);
    }

    public reportPropUse(data: any): void {
        this._reportEvent(ReportEventEnum.Prop_Use, data);
    }

    public reportChallengeStart(data: any): void {
        this._reportEvent(ReportEventEnum.Challenge_Start, data);
    }

    public reportChallengeRevive(data: any): void {
        this._reportEvent(ReportEventEnum.Challenge_Revive, data);
    }

    public reportChallengeVictory(data: any): void {
        this._reportEvent(ReportEventEnum.Challenge_Victory, data);
    }

    public reportChallengeFail(data: any): void {
        this._reportEvent(ReportEventEnum.Challenge_Fail, data);
    }

    public reportTaskReward(data: any): void {
        this._reportEvent(ReportEventEnum.Task_Reward, data);
    }

    public reportPassReward(data: any): void {
        this._reportEvent(ReportEventEnum.Pass_Reward, data);
    }

    public reportStreakReward(data: any): void {
        this._reportEvent(ReportEventEnum.Streak_Reward, data);
    }

    public reportInterstitialReady(data: any): void {
        this._reportEvent(ReportEventEnum.Interstitial_Ready, data);
    }

    public reportShopOpen(data: any): void {
        this._reportEvent(ReportEventEnum.Shop_Open, data);
    }

    public reportShopClick(data: any): void {
        this._reportEvent(ReportEventEnum.Shop_Click, data);
    }

    public reportShopBuy(data: any): void {
        this._reportEvent(ReportEventEnum.Shop_Buy, data);
    }

    public reportShopReward(data: any): void {
        this._reportEvent(ReportEventEnum.Shop_Reward, data);
    }

    public reportSpinGet(data: any): void {
        this._reportEvent(ReportEventEnum.Spin_Get, data);
    }

    public reportLevelAdBox(data: any): void {
        this._reportEvent(ReportEventEnum.LevelAdBox, data);
    }

    public reportRaceRewardGet(data: any): void {
        this._reportEvent(ReportEventEnum.RaceReward_Get, data);
    }

    public reportPassOpen(data: any): void {
        this._reportEvent(ReportEventEnum.Pass_Open, data);
    }

    public reportPassProgress(data: any): void {
        this._reportEvent(ReportEventEnum.Pass_Progress, data);
    }

    public reportWinStreakOpen(data: any): void {
        this._reportEvent(ReportEventEnum.WinStreak_Open, data);
    }

    public reportWinStreakProgress(data: any): void {
        this._reportEvent(ReportEventEnum.WinStreak_Progress, data);
    }

    public reportWinStreakFail(data: any): void {
        this._reportEvent(ReportEventEnum.WinStreak_Fail, data);
    }

    public reportSkinUnlock(data: any): void {
        this._reportEvent(ReportEventEnum.SkinUnlock, data);
    }

    public reportSkinChange(data: any): void {
        this._reportEvent(ReportEventEnum.SkinExchange, data);
    }

    public reportToyRaceOpen(data: any): void {
        this._reportEvent(ReportEventEnum.Toy_Race_Open, data);
    }

    public reportToyRaceMatch(data: any): void {
        this._reportEvent(ReportEventEnum.ToyRace_Match, data);
    }

    public reportToyRaceProgress(data: any): void {
        this._reportEvent(ReportEventEnum.ToyRace_Progress, data);
    }

    public reportToyRaceFail(data: any): void {
        this._reportEvent(ReportEventEnum.ToyRace_Fail, data);
    }

    public reportToyRaceReward(data: any): void {
        this._reportEvent(ReportEventEnum.ToyRaceReward_Get, data);
    }

    public reportSunLeagueOpen(data: any): void {
        this._reportEvent(ReportEventEnum.SunLeague_Open, data);
    }

    public reportSunLeagueProgress(data: any): void {
        this._reportEvent(ReportEventEnum.SunLeague_Progress, data);
    }

    public reportSunLeagueGet(data: any): void {
        this._reportEvent(ReportEventEnum.SunLeague_Get, data);
    }

    public reportRaceOpen(data: any): void {
        this._reportEvent(ReportEventEnum.Race_Open, data);
    }

    public reportRaceMatch(data: any): void {
        this._reportEvent(ReportEventEnum.Race_Match, data);
    }

    public reportRaceProgress(data: any): void {
        this._reportEvent(ReportEventEnum.Race_Progress, data);
    }

    public reportRaceFail(data: any): void {
        this._reportEvent(ReportEventEnum.Race_Fail, data);
    }

    public reportGoldOpen(data: any): void {
        this._reportEvent(ReportEventEnum.Gold_Open, data);
    }

    public reportGoldProgress(data: any): void {
        this._reportEvent(ReportEventEnum.Gold_Progress, data);
    }

    public reportGoldGet(data: any): void {
        this._reportEvent(ReportEventEnum.Gold_Get, data);
    }

    public reportMiningOpen(data: any): void {
        this._reportEvent(ReportEventEnum.Mining_Open, data);
    }

    public reportMiningProgress(data: any): void {
        this._reportEvent(ReportEventEnum.Mining_Progress, data);
    }

    public reportMiningGet(data: any): void {
        this._reportEvent(ReportEventEnum.Mining_Get, data);
    }

    public reportMiningPickaxeGet(data: any): void {
        this._reportEvent(ReportEventEnum.Mining_Pickaxe_Get, data);
    }

    public reportSuperWandOpen(data: any): void {
        this._reportEvent(ReportEventEnum.BonusWandPropOpen, data);
    }

    public reportSuperWandProgress(data: any): void {
        this._reportEvent(ReportEventEnum.BonusWandPropProgress, data);
    }

    public reportSuperWandReset(data: any): void {
        this._reportEvent(ReportEventEnum.BonusWandPropRest, data);
    }

    public reportSuperWandUse(data: any): void {
        this._reportEvent(ReportEventEnum.BonusWandPropUse, data);
    }

    public reportInviteClick(data: any): void {
        this._reportEvent(ReportEventEnum.InviteClick, data);
    }

    public reportShareClick(data: any): void {
        this._reportEvent(ReportEventEnum.ShareClick, data);
    }

    public reportInviteLongShow(data: any): void {
        this._reportEvent(ReportEventEnum.InviteLong_Show, data);
    }

    public reportInviteLongClick(data: any): void {
        this._reportEvent(ReportEventEnum.InviteLong_Click, data);
    }

    private _reportEvent(eventName: string, params: any): void {
        params.Level_Id = AnalyticsManager.gameDataQuerier?.curLv();
        params.IsNew = AnalyticsManager.gameDataQuerier?.isNew();
        params.GoldCoin = AnalyticsManager.gameDataQuerier?.coins();
        params.GameVersion = AnalyticsManager.version;
        params.Back = AnalyticsManager.gameDataQuerier?.backs();
        params.Tip = AnalyticsManager.gameDataQuerier?.hints();
        params.Refresh = AnalyticsManager.gameDataQuerier?.fresh();
        params.Light = AnalyticsManager.gameDataQuerier?.light();
        params.Tile = AnalyticsManager.gameDataQuerier?.skin();
        params.AdsNum = AdsManager.getInstance()?.getRewardedVideoTimes();

        if (this.reportDebug) {
            console.log('_reportEvent detail:', eventName, JSON.stringify(params));
        } else {
            ReporterBridge.reportEvent(eventName, params);
        }
    }

    public setUserProperty(properties: any): void {
        if (this.reportDebug) {
            console.log('setUserProperty:', JSON.stringify(properties));
        } else {
            ReporterBridge.setUserProperty(properties);
        }
    }

    public setOnceUserProperty(properties: any): void {
        if (this.reportDebug) {
            console.log('setOnceUserProperty:', JSON.stringify(properties));
        } else {
            ReporterBridge.setOnceUserProperty(properties);
        }
    }

    public incUserProperty(properties: any): void {
        if (this.reportDebug) {
            console.log('incUserProperty:', JSON.stringify(properties));
        } else {
            ReporterBridge.incUserProperty(properties);
        }
    }
}