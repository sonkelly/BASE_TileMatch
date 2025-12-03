import { _decorator, error } from 'cc';
import { channelManager, ChannelType } from './ChannelManager';
import { FbInstantSdkWrapper } from './FbInstantSdkWrapper';
import { TestSdkWrapper } from './TestSdkWrapper';
import { TtSdkWrapper } from './TtSdkWrapper';
import { WxSdkWrapper } from './WxSdkWrapper';
import { AndroidSdkWrapper } from './AndroidSdkWrapper';

export class AdVideoOption {
    completeHandler: any = null;
    errorHandler: any = null;
}

export class SupportAPI {
    static switchGameAsync = 'switchGameAsync';
}

export class SdkBridge {
    private static sdkWrapper: any = null;
    private static inited: boolean = false;

    static initSdk(): void {
        if (!SdkBridge.inited) {
            SdkBridge.inited = true;
            try {
                const channelType = channelManager.getChannelType();
                let wrapper = null;

                switch (channelType) {
                    case ChannelType.FaceBook:
                        wrapper = FbInstantSdkWrapper.getInstance();
                        break;
                    case ChannelType.WeChat:
                        wrapper = WxSdkWrapper.getInstance();
                        break;
                    case ChannelType.TT:
                        wrapper = TtSdkWrapper.getInstance();
                        break;
                    case ChannelType.Test:
                        wrapper = TestSdkWrapper.getInstance();
                        break;
                    case ChannelType.Android:
                        wrapper = AndroidSdkWrapper.getInstance();
                        break;
                }

                if (wrapper) {
                    SdkBridge.sdkWrapper = wrapper;
                    SdkBridge.sdkWrapper.init();
                }
            } catch (err) {
                error('SdkBridge.initSdk error: ', err);
            }
        }
    }

    static getSdkWrapper(): any {
        return SdkBridge.sdkWrapper;
    }

    static setShareImg(): void {}

    static preloadVideo(): void {
        SdkBridge.sdkWrapper.preloadVideo();
    }

    static preloadInterstitial(): void {
        SdkBridge.sdkWrapper.preloadInterstitial();
    }

    static getEntryPointData(): any {
        return SdkBridge.sdkWrapper.getEntryPointData();
    }

    static isRewardVideoAvailable(): boolean {
        return SdkBridge.sdkWrapper.isVideoAvailable();
    }

    static login(callback: any): any {
        return SdkBridge.sdkWrapper.login(callback);
    }

    static vibrate(pattern: any): void {
        SdkBridge.sdkWrapper?.vibrate(pattern);
    }

    static async showVideo(options: any): Promise<any> {
        return SdkBridge.sdkWrapper.showVideo(options);
    }

    static isInterstitialAvailable(): boolean {
        return SdkBridge.sdkWrapper.isInterstitialAvailable();
    }

    static showInterstitial(options: any): void {
        SdkBridge.sdkWrapper.showInterstitial(options);
    }

    static showBanner(options: any): void {
        SdkBridge.sdkWrapper.showBanner(options);
    }

    static hideBanner(): void {
        SdkBridge.sdkWrapper.hideBanner();
    }

    static async shareAsync(options: any): Promise<any> {
        return SdkBridge.sdkWrapper.shareAsync(options);
    }

    static checkShareResult(options: any): void {
        SdkBridge.sdkWrapper.checkShareResult?.(options);
    }

    static async inviteAsync(options: any): Promise<any> {
        return SdkBridge.sdkWrapper.inviteAsync(options);
    }

    static getPlayerId(): string {
        return SdkBridge.sdkWrapper.getPlayerId();
    }

    static getPlayerName(): string {
        return SdkBridge.sdkWrapper.getPlayerName();
    }

    static getPlayerPhotoUrl(): string {
        return SdkBridge.sdkWrapper.getPlayerPhotoUrl();
    }

    static getPlatform(): string {
        return SdkBridge.sdkWrapper.getPlatform();
    }

    static getSupportedAPIs(): string[] {
        return SdkBridge.sdkWrapper.getSupportedAPIs();
    }

    static isSupportAPI(apiName: string): boolean {
        return this.getSupportedAPIs().includes(apiName);
    }

    static checkCanPayment(): boolean {
        return SdkBridge.isSupportAPI('payments.purchaseAsync');
    }

    static async getDataAsync(keys: string[]): Promise<any> {
        return SdkBridge.sdkWrapper.getDataAsync(keys);
    }

    static async setDataAsync(data: any): Promise<any> {
        return SdkBridge.sdkWrapper.setDataAsync(data);
    }

    static async clearDataAsync(keys: string[]): Promise<any> {
        return SdkBridge.sdkWrapper.clearDataAsync(keys);
    }

    static quitGame(): any {
        return SdkBridge.sdkWrapper.quitGame();
    }

    static async getConnectedPlayersAsync(): Promise<any> {
        return SdkBridge.sdkWrapper.getConnectedPlayersAsync?.();
    }

    static async createContextAsync(playerId: string): Promise<any> {
        return SdkBridge.sdkWrapper.createContextAsync?.(playerId);
    }

    static async chooseContextAsync(): Promise<any> {
        return SdkBridge.sdkWrapper.chooseContextAsync?.();
    }

    static async updateCustomAsync(options: any): Promise<any> {
        return SdkBridge.sdkWrapper.updateCustomAsync?.(options) ?? Promise.reject("function updateCustomAsync not found");
    }

    static async getTournamentAsync(): Promise<any> {
        return SdkBridge.sdkWrapper.getTournamentAsync?.();
    }

    static async tournamentShareAsync(score: number, data: any): Promise<any> {
        return SdkBridge.sdkWrapper.tournamentShareAsync?.(score, data);
    }

    static async createTournamentAsync(options: any): Promise<any> {
        return SdkBridge.sdkWrapper.createTournamentAsync?.(options);
    }

    static async setLeaderboardScoreAsync(leaderboardName: string, score: number): Promise<any> {
        return SdkBridge.sdkWrapper.setLeaderboardScoreAsync?.(leaderboardName, score);
    }

    static async getLeaderboardEntriesAsync(leaderboardName: string): Promise<any> {
        return SdkBridge.sdkWrapper.getLeaderboardEntriesAsync(leaderboardName);
    }

    static checkPayOnReady(options: any): any {
        return SdkBridge.sdkWrapper.checkPayOnReady(options);
    }

    static purchase(options: any): any {
        return SdkBridge.sdkWrapper.purchase(options);
    }

    static checkPurchaseState(): any {
        return SdkBridge.sdkWrapper.checkPurchaseCost();
    }

    static costPurchase(options: any): any {
        return SdkBridge.sdkWrapper.costPurchase(options);
    }

    static checkCanPurchase(): boolean {
        return SdkBridge.sdkWrapper.checkCanPurchase();
    }

    static async getCatalogAsync(): Promise<any> {
        return SdkBridge.sdkWrapper.getCatalogAsync();
    }

    static checkPurchaseCost(): any {
        return SdkBridge.sdkWrapper.checkPurchaseCost();
    }
}