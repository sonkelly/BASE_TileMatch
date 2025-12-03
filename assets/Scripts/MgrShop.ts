import { _decorator, cclegacy, macro, director } from 'cc';
import {MgrBase} from './MgrBase';
import { ShopData } from './ShopData';
import { GameConst, ITEM } from './GameConst';
import { SdkBridge } from './SdkBridge';
import { MgrGame } from './MgrGame';
import {ShopCfg} from './ShopCfg';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';
import {Language} from './Language';
import {Toast} from './Toast';
import { IAPMgr } from './IAPMgr';
import { AnalyticsManager } from './AnalyticsManager';
import {Tools} from './Tools';
import { AdsManager } from './AdsManager';
import { MgrPig } from './MgrPig';
import { Firebase } from './Firebase';
import { ShopPackagePrefabType } from './Const';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrBattleLevel } from './MgrBattleLevel';
import {each, parseInt} from 'lodash-es';

const { ccclass, property } = _decorator;

export const GoldPigShopId = 301;

@ccclass('MgrShop')
export class MgrShop extends MgrBase {
    private _data: ShopData = null;
    private _packageInited: boolean = false;
    private _intoShopFlag: boolean = true;

    public static get Instance(): MgrShop {
        return this._instance as MgrShop;
    }

    protected onLoad(): void {
        this._data = new ShopData('shop-data');
    }

    public load(): void {
        this._data.load();
    }

    public initLoadData(): void {
        this.schedule(this._fixedUpdate.bind(this), 1, macro.REPEAT_FOREVER, Math.random());
        this.checkShopOpen();
    }

    private _fixedUpdate(dt: number): void {
        if (this._packageInited) {
            this._checkLimitedPackageRefresh();
            this._checkTurnPackageRefresh();
            this._checkNormalPackageRefresh();
            this._checkCurrencyPackageRefresh();
        }
    }

    private _initPackage(): void {
        this._packageInited = true;
        this._initLimitedPackage();
        this._initTurnPackage();
        this._initNormalPackage();
        this._initCurrencyPackage();
    }

    public getPrefabByType(type: ShopPackagePrefabType): any {
        switch (type) {
            case ShopPackagePrefabType.ShopItemLimited:
                return UIPrefabs.ShopItemLimited;
            case ShopPackagePrefabType.ShopItemNormal:
                return UIPrefabs.ShopItemNormal;
            case ShopPackagePrefabType.ShopItemCoin:
                return UIPrefabs.ShopItemCoin;
            case ShopPackagePrefabType.ShopAdItem:
                return UIPrefabs.ShopAdItem;
            default:
                console.error('no prefab by type: ', type);
                return null;
        }
    }

    private _initLimitedPackage(): void {
        this._data.initLimitedPackage();
    }

    private _checkLimitedPackageRefresh(): void {
        this._data.checkLimitedPackageRefresh();
    }

    private _initTurnPackage(): void {
        this._data.initTurnPackage();
    }

    private _checkTurnPackageRefresh(): void {
        this._data.checkTurnPackageRefresh();
    }

    private _initNormalPackage(): void {
        this._data.initAndCheckNormalPackage();
    }

    private _checkNormalPackageRefresh(): void {
        this._data.initAndCheckNormalPackage();
    }

    private _initCurrencyPackage(): void {
        this._data.initAndCheckCurrencyPackage();
    }

    private _checkCurrencyPackageRefresh(): void {
        this._data.initAndCheckCurrencyPackage();
    }

    public activeShop(packageId: number, showCnt: number, openTime: number): void {
        this._data.activePackage(packageId, showCnt, openTime);
    }

    public resetCyclePackage(packageId: number): void {
        this._data.resetCyclePackage(packageId);
    }

    public checkShopOpen(): boolean {
        const isOpen = MgrGame.Instance.gameData.maxLv >= GameConst.Shop_Open_Level;
        if (isOpen && !this._packageInited) {
            this._initPackage();
        }
        return isOpen;
    }

    public checkLimitCycleBuyCntMax(packageId: number): boolean {
        const packageData = this._data.packages[packageId];
        const cfg = ShopCfg.Instance.get(packageId);
        return cfg.limitCycleBuyCnt !== 0 && packageData.cycleBuyCnt >= cfg.limitCycleBuyCnt;
    }

    public checkLimitBuyCntMax(packageId: number): boolean {
        const packageData = this._data.packages[packageId];
        const cfg = ShopCfg.Instance.get(packageId);
        return cfg.limitBuyCnt !== 0 && packageData.buyCnt >= cfg.limitBuyCnt;
    }

    public getPackageLimitCycleLeftCnt(packageId: number): number {
        const packageData = this._data.packages[packageId];
        const cfg = ShopCfg.Instance.get(packageId);
        return cfg.limitCycleBuyCnt !== 0 ? cfg.limitCycleBuyCnt - packageData.cycleBuyCnt : -1;
    }

    public getLimitedPackageId(): number {
        return this._data.limitedPackage.id;
    }

    public getTurnPackageId(): number {
        return this._data.turnPackage.id;
    }

    public getPackageCloseTime(packageId: number): number {
        return this._data.getPackageCloseTime(packageId);
    }

    public getPackageBuyData(packageId: number): any {
        return this._data.packages[packageId];
    }

    public getGoldPigCfg(): any {
        return ShopCfg.Instance.get(GoldPigShopId);
    }

    public getPackageBuyCount(packageId: number): number {
        const packageData = this._data.packages[packageId];
        return packageData?.buyCnt || 0;
    }

    public checkLimitedPackageAvailable(): boolean {
        if (this._intoShopFlag) {
            return false;
        }
        const packageId = this.getLimitedPackageId();
        return !!packageId && 
               this.getPackageCloseTime(packageId) - Tools.GetNowTime() > 0 &&
               !this.checkLimitCycleBuyCntMax(packageId);
    }

    public isBuyNoAd(): boolean {
        for (const packageId of GameConst.REMOVE_ADS_PACKIDS) {
            const packageData = this._data.packages[packageId];
            if (packageData && packageData.buyCnt > 0) {
                return true;
            }
            const cfg = ShopCfg.Instance.get(packageId);
            if (IAPMgr.Instance.checkProductOwned(cfg)) {
                return true;
            }
        }
        return false;
    }

    public getPayNum(): number {
        let count = 0;
        each(this._data.packages, (data, id) => {
            count += data.buyCnt;
        });
        return count;
    }

    public getPayMoney(): number {
        let money = 0;
        each(this._data.packages, (data, id) => {
            const packageId = parseInt(id);
            const cfg = ShopCfg.Instance.get(packageId);
            money += data.buyCnt * cfg.cost;
        });
        return Number(money.toFixed(2));
    }

    public buyPackage(productId: string, dealId: string, count: number = 1): void {
        const cfg = ShopCfg.Instance.getCfgByProductId(productId);
        this.givenShopReward(productId, dealId, cfg, count);
    }

    public givenShopReward(productId: string, dealId: string, cfg: any, count: number): void {
        let rewardStr = '';
        
        if (cfg.id !== GoldPigShopId) {
            const rewards = cfg.reward.split(',');
            for (const reward of rewards) {
                const [itemId, amount] = reward.split('|');
                const item = Number(itemId);
                const num = Number(amount) * count;
                MgrUser.Instance.userData.addItem(item, num, { type: 'ShopIap' });
            }
        } else {
            const item = ITEM.Coin;
            const amount = MgrPig.Instance.data.pigCoin * count;
            rewardStr = `${item}|${amount}`;
            MgrUser.Instance.userData.addItem(item, amount, { type: 'ShopIap' });
            MgrPig.Instance.buyGoldPig();
        }

        this.addBuyCnt(cfg.id);
        director.emit(GlobalEvent.shopBuyPackage, cfg.id);
        Toast.tip(Language.Instance.getLangByID('shop_buy_suc'));

        for (const packageId of GameConst.REMOVE_ADS_PACKIDS) {
            if (cfg.id === packageId) {
                AdsManager.getInstance().hideBanner();
                director.emit(GlobalEvent.refreshRemoveAdState);
            }
        }

        const analyticsData = {
            Commodity_ID: productId,
            Shop_ID: cfg.id,
            ProductType: cfg.type,
            Dill_ID: dealId,
            CommodityItem: rewardStr,
            BuyNum: this.getPackageBuyCount(cfg.id),
            PayNum: this.getPayNum(),
            PayMoney: this.getPayMoney()
        };

        AnalyticsManager.getInstance().reportShopReward(analyticsData);
        AnalyticsManager.getInstance().incUserProperty({ CK_PayNum: 1 });
        AnalyticsManager.getInstance().incUserProperty({ CK_PayMoney: cfg.cost });
        this.reportIAPPurchase(cfg.cost, productId);
    }

    public addBuyCnt(packageId: number): void {
        this._data.buyPackage(packageId);
    }

    public reportIAPPurchase(amount: number, productId: string): void {
        const data = {
            productId: productId,
            currency: 'USD',
            value: amount
        };
        Firebase.reportEvent('tch_ad_rev_roas_001', data);
    }

    public checkShopRemoveTip(callback?: Function): void {
        if (this.isBuyNoAd() || this._data.showedNoAdsTip > 0) {
            callback?.();
            return;
        }

        if (AdsManager.getInstance().showedInterstitial) {
            if (MgrBattleLevel.Instance.checkIsBattleLevel(MgrGame.Instance.gameData.curLv)) {
                callback?.();
            } else {
                if (SdkBridge.checkCanPayment()) {
                    MgrUi.Instance.openViewAsync(UIPrefabs.RemoveAdTip, {
                        callback: (view: any) => {
                            view.once(VIEW_ANIM_EVENT.Remove, () => {
                                callback?.();
                            });
                        }
                    });
                }
                this._data.showedNoAdsTip = 1;
                director.emit(GlobalEvent.refreshRemoveAdState);
            }
        } else {
            callback?.();
        }
    }

    public getShowedNoAdsTip(): boolean {
        return this._data.showedNoAdsTip === 1;
    }

    public set intoShopFlag(value: boolean) {
        this._intoShopFlag = value;
    }
}