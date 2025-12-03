import { _decorator, sys, game } from 'cc';
import { BasicSocialPlayer } from './BasicSocialPlayer';
import { TestAdWrapper } from './TestAdWrapper';
import { config } from './Config';

const { ccclass } = _decorator;

@ccclass('TestSdkWrapper')
export class TestSdkWrapper {
    private static instance: TestSdkWrapper = new TestSdkWrapper();
    private adMgr: TestAdWrapper | null = null;
    private me: BasicSocialPlayer = new BasicSocialPlayer();
    private connectedPlayers: any[] = [];

    private constructor() {}

    public static getInstance(): TestSdkWrapper {
        return TestSdkWrapper.instance;
    }

    public init(): void {
        this.adMgr = new TestAdWrapper();
        this.adMgr.init();
    }

    public preloadVideo(): void {}

    public preloadInterstitial(): void {}

    public login(callback: { onSucceed?: (code: string) => void }): void {
        let code = sys.localStorage.getItem(config.gameName + '_testSdkCode');
        if (!code) {
            code = (10000 + Math.floor(1000000 * Math.random())).toString();
            sys.localStorage.setItem(config.gameName + '_testSdkCode', code);
        }
        callback.onSucceed?.(code);
    }

    public shareAsync(callback?: { onSucceed?: () => void }): Promise<void> {
        return new Promise((resolve) => {
            callback?.onSucceed?.();
            resolve();
        });
    }

    public inviteAsync(callback?: () => void): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public isVideoAvailable(): boolean {
        return this.adMgr?.isVideoAvailable() ?? false;
    }

    public showVideo(callback: any): void {
        this.adMgr?.showVideo(callback);
    }

    public isInterstitialAvailable(): boolean {
        return this.adMgr?.isInterstitialAvailable() ?? false;
    }

    public showInterstitial(callback: any): void {
        this.adMgr?.showInterstitial(callback);
    }

    public showBanner(callback: any): void {
        this.adMgr?.showBanner(callback);
    }

    public hideBanner(): void {
        this.adMgr?.hideBanner();
    }

    public getLeaderboardEntriesAsync(callback: any): Promise<any[]> {
        return new Promise((resolve) => {
            resolve([]);
        });
    }

    public getPlatform(): string {
        return '';
    }

    public getPlayerId(): string {
        return this.me.getID();
    }

    public getPlayerName(): string {
        return this.me.getName();
    }

    public getPlayerPhotoUrl(): string {
        return this.me.getPhoto();
    }

    public getSupportedAPIs(): string[] {
        return ['payments.purchaseAsync'];
    }

    public getEntryPointData(): object {
        return {};
    }

    public getDataAsync(keys: string[]): Promise<object> {
        return new Promise((resolve) => {
            resolve({});
        });
    }

    public setDataAsync(data: object): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public clearDataAsync(keys: string[]): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public quitGame(): void {
        game.end();
    }

    public vibrate(duration: number): void {}

    public chooseContextAsync(): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public getConnectedPlayersAsync(): Promise<any[]> {
        return new Promise((resolve) => {
            resolve([]);
        });
    }

    public createTournamentAsync(data: object): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public tournamentShareAsync(data: object, callback: any): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public getTournamentAsync(): any {
        return null;
    }
}