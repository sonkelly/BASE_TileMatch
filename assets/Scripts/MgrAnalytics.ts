import { _decorator, Component } from 'cc';
import { MgrBase } from './MgrBase';
import { AnalyticsData } from './AnalyticsData';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('MgrAnalytics')
export class MgrAnalytics extends MgrBase {
    private _data: AnalyticsData | null = null;
    private _gameTime: number = 0;
    private _inGame: boolean = false;
    public eliminateCnt: number = 0;
    public interstitialCnt: number = 0;

    private static _instance: MgrAnalytics;

    public static get Instance(): MgrAnalytics {
        return MgrAnalytics._instance;
    }

    protected onLoad(): void {
        this._data = new AnalyticsData('analytics-data');
        MgrAnalytics._instance = this;
    }

    public load(): void {
        this.data.load();
    }

    public initLoadData(): void {}

    public stopGameTime(): void {
        this._inGame = false;
    }

    public startGameTime(): void {
        this._inGame = true;
        this._gameTime = 0;
    }

    public resumeGameTime(): void {
        this._inGame = true;
    }

    protected lateUpdate(dt: number): void {
        if (this._inGame) {
            this._gameTime += dt;
        }
    }

    public getCoinUseType(item: ITEM): string {
        if (item === ITEM.Back) return 'BuyShopBack';
        if (item === ITEM.Hint) return 'BuyShopTip';
        if (item === ITEM.Fresh) return 'BuyShopRefresh';
        return 'item: ' + item;
    }

    public getAdsTypeInShop(item: ITEM): string {
        switch (item) {
            case ITEM.Coin:
                return 'AdShop1';
            case ITEM.Back:
                return 'AdShop2';
            case ITEM.Hint:
                return 'AdShop3';
            case ITEM.Fresh:
                return 'AdShop4';
            default:
                return 'item: ' + item;
        }
    }

    public getAdsTypeInGame(item: ITEM): string {
        switch (item) {
            case ITEM.Back:
                return 'AdBack';
            case ITEM.Hint:
                return 'AdTip';
            case ITEM.Fresh:
                return 'AdRefresh';
            default:
                return 'item: ' + item;
        }
    }

    public get data(): AnalyticsData {
        return this._data!;
    }

    public get gameTime(): number {
        return this._gameTime;
    }

    public get inGame(): boolean {
        return this._inGame;
    }

    public set inGame(value: boolean) {
        this._inGame = value;
    }
}