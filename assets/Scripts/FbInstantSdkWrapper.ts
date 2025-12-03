import { _decorator, log } from 'cc';
import { SocialManager } from './SocialManager';
import { FbInstantAdWrapper } from './FbInstantAdWrapper';
import { Tools } from './Tools';

const { ccclass } = _decorator;

@ccclass('FbInstantSdkWrapper')
export class FbInstantSdkWrapper {
    private static instance: FbInstantSdkWrapper = new FbInstantSdkWrapper();
    private adMgr: FbInstantAdWrapper;
    private isHapticSupported: boolean = false;
    private hasShowCreateShort: boolean = false;
    private static kLeaderboardEntryOffset: number = 0;
    private static kLeaderboardEntryCount: number = 10;

    public static getInstance(): FbInstantSdkWrapper {
        return FbInstantSdkWrapper.instance;
    }

    constructor() {
        this.adMgr = new FbInstantAdWrapper();
        this.isHapticSupported = true;
        this.hasShowCreateShort = true;
    }

    public async init(): Promise<void> {
        this.adMgr = new FbInstantAdWrapper();
        this.adMgr.init();
        
        const supportedAPIs = this.getSupportedAPIs();
        if (supportedAPIs) {
            this.isHapticSupported = supportedAPIs.includes('performHapticFeedbackAsync');
        }
        
        this.getASIDAsync();
        await this.tryToSubscribeBotAsync();
    }

    private async getASIDAsync(): Promise<void> {
        try {
            if (!window.FBInstant) return;

            const asid = await FBInstant.player.getASIDAsync();
            const psid = FBInstant.player.getID();
            const data = {
                asid: asid,
                psid: psid,
                appid: 0x3286f0fe1068d,
                timezone: new Date().getTimezoneOffset()
            };

            const xhr = new XMLHttpRequest();
            xhr.timeout = 4000;
            xhr.onreadystatechange = function() {};
            xhr.open('POST', 'https://fbwebhook.dblidle.com/game-fallback');
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.send(JSON.stringify(data));
        } catch (error) {
            console.error('error Asid: ========>', error);
        }
    }

    public getSupportedAPIs(): string[] {
        return window.FBInstant ? FBInstant.getSupportedAPIs() : [];
    }

    public preloadVideo(): void {
        this.adMgr.preloadVideo();
    }

    public preloadInterstitial(): void {
        this.adMgr.preloadInterstitial();
    }

    public showVideo(callback: Function): Promise<boolean> {
        return this.adMgr.showVideo(callback);
    }

    public isVideoAvailable(): boolean {
        return this.adMgr.isVideoAvailable();
    }

    public showInterstitial(callback: Function): void {
        this.adMgr.showInterstitial(callback);
    }

    public isInterstitialAvailable(): boolean {
        return this.adMgr.isInterstitialReady();
    }

    public showBanner(callback: Function): void {
        this.adMgr.showBanner(callback);
    }

    public hideBanner(): void {
        this.adMgr.hideBanner();
    }

    public async shareAsync(shareData: any): Promise<void> {
        return FBInstant.shareAsync(shareData)
            .then(() => {})
            .catch((error) => {
                console.log('share error: ', error);
            });
    }

    public getConnectedPlayersAsync(): Promise<any> | boolean {
        return window.FBInstant ? FBInstant.player.getConnectedPlayersAsync() : false;
    }

    public getPlayerId(): string {
        return FBInstant.player.getID();
    }

    public getPlayerName(): string {
        return FBInstant.player.getName();
    }

    public getPlayerPhotoUrl(): string {
        return FBInstant.player.getPhoto();
    }

    public getContextType(): string {
        return FBInstant.context.getType();
    }

    public getContextId(): string {
        return FBInstant.context.getID();
    }

    public createContextAsync(playerId: string): Promise<void> {
        return FBInstant.context.createAsync(playerId);
    }

    public chooseContextAsync(): Promise<void> {
        return FBInstant.context.chooseAsync();
    }

    public getContextPlayersAsync(): Promise<any[]> {
        return FBInstant.context.getPlayersAsync();
    }

    public getDataAsync(keys: string[]): Promise<any> | boolean {
        return window.FBInstant ? FBInstant.player.getDataAsync(keys) : false;
    }

    public setDataAsync(data: any): Promise<void> {
        return FBInstant.player.setDataAsync(data);
    }

    public async clearDataAsync(data: any): Promise<void> {
        await FBInstant.player.setDataAsync(data);
        await FBInstant.player.flushDataAsync();
    }

    public quitGame(): void {
        FBInstant.quit();
    }

    public updateCustomAsync(updateData: any): Promise<void> {
        return FBInstant.updateAsync(updateData);
    }

    public updateLeaderboardAsync(updateData: any): Promise<void> {
        return FBInstant.updateAsync(updateData);
    }

    public getEntryPointData(): any {
        return FBInstant.getEntryPointData();
    }

    public getEntryPointAsync(): Promise<string> {
        return FBInstant.getEntryPointAsync();
    }

    public async createShortcutAsync(): Promise<void> {
        if (this.hasShowCreateShort) return;

        this.hasShowCreateShort = true;
        FBInstant.canCreateShortcutAsync()
            .then((canCreate) => {
                if (canCreate) {
                    FBInstant.createShortcutAsync()
                        .then(() => {
                            console.log('create short success: ');
                        })
                        .catch((error) => {
                            console.log('create short reason: ', error);
                        });
                }
            });
    }

    public async tryToSubscribeBotAsync(): Promise<boolean> {
        if (!window.FBInstant) return true;

        const canSubscribe = await FBInstant.player.canSubscribeBotAsync()
            .then(() => true)
            .catch((error) => {
                log('canSubscribeBotAsync error:', error);
                return false;
            });

        if (canSubscribe) {
            return FBInstant.player.subscribeBotAsync()
                .then(() => {
                    log('subscribeBotAsync succeded.');
                    return true;
                })
                .catch((error) => {
                    log('subscribeBotAsync error:', error);
                    return false;
                });
        }
        return false;
    }

    public async setLeaderboardScoreAsync(leaderboardName: string, score: number): Promise<void> {
        const leaderboardId = leaderboardName + '.' + FBInstant.context.getID();
        try {
            const leaderboard = await FBInstant.getLeaderboardAsync(leaderboardId);
            await leaderboard.setScoreAsync(score)
                .then(() => {
                    FBInstant.updateAsync({
                        action: 'LEADERBOARD',
                        name: leaderboardId
                    });
                })
                .catch((error) => {
                    console.log('update score fail:', error);
                });
        } catch (error) {
            console.log('set score fail: ===========>', error);
        }
    }

    public async getLeaderboardEntriesAsync(leaderboardName: string): Promise<any> {
        const leaderboardId = leaderboardName + '.' + FBInstant.context.getID();
        try {
            const leaderboard = await FBInstant.getLeaderboardAsync(leaderboardId);
            return leaderboard.getEntriesAsync(
                FbInstantSdkWrapper.kLeaderboardEntryCount,
                FbInstantSdkWrapper.kLeaderboardEntryOffset
            );
        } catch (error) {
            console.log('getLeaderboardEntriesAsync() error:', error);
            return null;
        }
    }

    public async inviteAsync(inviteData: any): Promise<void> {
        return FBInstant.inviteAsync(inviteData)
            .catch((error) => {
                log('inviteAsync() error:', error);
            });
    }

    public postSessionScoreAsync(score: number): Promise<void> {
        return FBInstant.postSessionScoreAsync(score);
    }

    public tournamentShareAsync(score: number, data: any): Promise<void> {
        return FBInstant.tournament.shareAsync({
            score: score,
            data: data
        });
    }

    public async createTournamentAsync(initialScore: number): Promise<void> {
        return FBInstant.tournament.createAsync({
            initialScore: initialScore,
            data: {
                tournamentLevel: 'hard'
            },
            config: {
                title: 'Championships',
                image: SocialManager.getInstance().tournamentImg,
                sortOrder: 'HIGHER_IS_BETTER',
                scoreFormat: 'NUMERIC',
                endTime: Math.floor(Tools.GetNowTime() / 1000) + 604800
            }
        })
        .then((tournament) => {
            console.log(tournament.getContextID(), tournament.getPayload());
        })
        .catch((error) => {
            console.log('createTournamentAsync error: ', error);
        });
    }

    public async getTournamentAsync(): Promise<any> {
        return FBInstant.getTournamentAsync()
            .catch((error) => {
                console.log('getTournamentAsync', error);
                return null;
            });
    }

    public async postTournamentScoreAsync(score: number): Promise<void> {
        return FBInstant.tournament.postScoreAsync(score)
            .catch((error) => {
                console.log('tournament.postScoreAsync() error:', error);
            });
    }

    public async shareTournamentAsync(score: number): Promise<void> {
        const tournament = await this.getTournamentAsync() || await this.createTournamentAsync(score);
        return FBInstant.tournament.shareAsync({
            score: score,
            data: {}
        })
        .catch((error) => {
            log('FBInstant.tournament.shareAsync() error:', error);
        });
    }

    public async switchGameAsync(appId: string, data: any): Promise<void> {
        return FBInstant.switchGameAsync(appId, data)
            .catch((error) => {
                log('switchGameAsync() error:', error);
            });
    }

    public async performHapticFeedbackAsync(): Promise<void> {
        if (this.isHapticSupported) {
            return FBInstant.performHapticFeedbackAsync()
                .catch((error) => {
                    log('performHapticFeedbackAsync() error:', error);
                });
        } else {
            return Promise.resolve();
        }
    }

    public getPlatform(): string {
        return FBInstant.getPlatform();
    }

    public login(params: { onSucceed?: Function }): void {
        params.onSucceed?.();
    }

    public purchase(productId: string): Promise<any> {
        return FBInstant.payments.purchaseAsync({
            productID: productId,
            developerPayload: 'foobar'
        });
    }

    public checkPayOnReady(callback: Function): void {
        FBInstant.payments.onReady(() => {
            callback?.();
        });
    }

    public checkPurchaseCost(): Promise<any[]> {
        return FBInstant.payments.getPurchasesAsync();
    }

    public costPurchase(purchaseToken: string): Promise<void> {
        return FBInstant.payments.consumePurchaseAsync(purchaseToken);
    }

    public checkCanPurchase(): boolean {
        return FBInstant.getSupportedAPIs().indexOf('payments.purchaseAsync') !== -1;
    }

    public getCatalogAsync(): Promise<any[]> {
        return window.FBInstant ? FBInstant.payments.getCatalogAsync() : Promise.resolve([]);
    }

    public getAppId(): number {
        return 0x3286f0fe1068d;
    }
}