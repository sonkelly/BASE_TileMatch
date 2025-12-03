import { _decorator, sys } from 'cc';
//import { get, set, includes } from 'lodash-es';
import { Facebook } from './Facebook';
import { Firebase } from './Firebase';
import { AnalyticsManager } from './AnalyticsManager';

const { ccclass } = _decorator;

@ccclass('AdAmountManager')
export class AdAmountManager {
    private static _instance: AdAmountManager;
    
    private fbData: string[] = [];
    private fireBaseData: string[] = [];
    private fireBaseAmount: number = 0;
    private fireBaseAmountCycle: number = 0;
    private adAmount: number = 0;

    private readonly fbThresholds: number[] = [0.01, 0.02, 0.03, 0.05];
    private readonly fbEvents: string[] = ['ad_revenue001', 'ad_revenue002', 'ad_revenue003', 'ad_revenue005'];
    private readonly firebaseThresholds: number[] = [0.002, 0.005, 0.01, 0.1];
    private readonly firebaseEvents: string[] = ['ad_revenue_0002', 'ad_revenue_0005', 'ad_revenue_001', 'ad_revenue_01'];
    private readonly fbStorageKey: string = 'ad-analytics-fb';
    private readonly firebaseStorageKey: string = 'ad-analytics-firebase';
    private readonly firebaseAmountKey: string = 'ad-firebase-amount';
    private readonly firebaseAmountCycleKey: string = 'ad-firebase-amount-cycle';
    private readonly adAmountKey: string = 'ad-amount';
    private readonly storageKey: string = 'ad-save-data';

    public static getInstance(): AdAmountManager {
        if (!this._instance) {
            this._instance = new AdAmountManager();
        }
        return this._instance;
    }

    public init(): void {
        this.loadSys();
    }

    private loadSys(): void {
        let data: any = sys.localStorage.getItem(this.storageKey) || {};
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        this.adAmount = Number(get(data, this.adAmountKey)) || 0;
        this.fireBaseAmount = Number(get(data, this.firebaseAmountKey)) || 0;
        this.fireBaseAmountCycle = Number(get(data, this.firebaseAmountCycleKey)) || 0;

        const fbDataStr: string = get(data, this.fbStorageKey) || '';
        this.fbData = fbDataStr.split(',');

        const firebaseDataStr: string = get(data, this.firebaseStorageKey) || '';
        this.fireBaseData = firebaseDataStr.split(',');

        this.saveSys();
    }

    private saveSys(): void {
        const data: any = {};
        set(data, this.adAmountKey, this.adAmount);
        set(data, this.firebaseAmountKey, this.fireBaseAmount);
        set(data, this.firebaseAmountCycleKey, this.fireBaseAmountCycle);
        set(data, this.fbStorageKey, this.fbData.join(','));
        set(data, this.firebaseStorageKey, this.fireBaseData.join(','));

        const jsonStr: string = JSON.stringify(data);
        sys.localStorage.setItem(this.storageKey, jsonStr);
    }

    public addAdAmount(adData: string): void {
        const data = JSON.parse(adData);
        const revenue: number = data.revenue;

        this.adAmount += revenue;
        this.fireBaseAmount += revenue;

        this.doThinkingReport(data);
        this.doFbReport();
        this.doFireBaseReport();
        this.doFireBaseReportCycle(revenue);

        this.saveSys();
    }

    private doThinkingReport(data: any): void {
        const reportData = {
            revenue: data.revenue,
            adUnitId: data.adUnitId,
            adType: data.adType,
            adNetwork: data.adNetwork,
            lifetimeRevenue: this.adAmount,
            currency: 'USD'
        };
        AnalyticsManager.getInstance().reportAdAmount(reportData);
    }

    private doFbReport(): void {
        for (let i = 0; i < this.fbThresholds.length; i++) {
            const threshold = this.fbThresholds[i];
            if (this.adAmount >= threshold) {
                const eventName = this.fbEvents[i];
                if (!includes(this.fbData, eventName)) {
                    this.fbData.push(eventName);
                    Facebook.reportEvent(eventName);
                }
            }
        }
    }

    private doFireBaseReport(): void {
        for (let i = 0; i < this.firebaseThresholds.length; i++) {
            const threshold = this.firebaseThresholds[i];
            if (this.fireBaseAmount >= threshold) {
                const eventName = this.firebaseEvents[i];
                if (!includes(this.fireBaseData, eventName)) {
                    this.fireBaseData.push(eventName);
                    Firebase.reportEvent(eventName, {});
                }
            }
        }

        const maxThreshold = this.firebaseThresholds[this.firebaseThresholds.length - 1];
        if (this.fireBaseAmount >= maxThreshold) {
            this.fireBaseAmount = 0;
            this.fireBaseData = [];
            this.saveSys();
        }
    }

    private doFireBaseReportCycle(revenue: number): void {
        this.fireBaseAmountCycle += revenue;
        if (this.fireBaseAmountCycle >= 0.01) {
            const amount = this.fireBaseAmountCycle;
            const data = {
                currency: 'USD',
                value: amount
            };
            
            Firebase.reportEvent('tch_ad_rev_roas_001', data);
            Facebook.reportPurchase(amount);
            
            this.fireBaseAmountCycle = 0;
        }
    }
}

export const adAmountMgr = AdAmountManager.getInstance();