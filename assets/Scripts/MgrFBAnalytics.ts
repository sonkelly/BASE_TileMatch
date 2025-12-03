import { _decorator, Component, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { FBAnalyticsData } from './FBAnalyticsData';

const { ccclass, property } = _decorator;

@ccclass('MgrFBAnalytics')
export class MgrFBAnalytics extends MgrBase {
    private _data: FBAnalyticsData | null = null;
    private _execTime: number = 0;
    private _stepTime: number = 10;

    protected onLoad(): void {
        this._data = new FBAnalyticsData('analytics-fb-data');
    }

    public load(): void {
        this._data?.load();
    }

    public initLoadData(): void {
        this._data?.addTotalLoginTimes();
        this._data?.initlevelCount();
    }

    protected lateUpdate(dt: number): void {
        this._execTime += dt;
        if (this._execTime >= this._stepTime) {
            this._execTime = 0;
            this._data?.addGameTime(this._stepTime);
        }
    }

    public addInterstitialCount(count: number): void {
        this._data?.addInterstitialCount(count);
    }

    public addRewardCount(count: number): void {
        this._data?.addRewardCount(count);
    }

    public addLevelCount(count: number): void {
        this._data?.addLevelCount(count);
    }

    private static _instance: MgrFBAnalytics;
    public static get Instance(): MgrFBAnalytics {
        return MgrFBAnalytics._instance;
    }
}