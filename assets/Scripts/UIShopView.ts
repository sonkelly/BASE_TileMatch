import { _decorator, Component, ScrollView, Node, Widget, Layout, Button, view, Vec2 } from 'cc';
import { ShopCfg } from './ShopCfg';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { SdkBridge } from './SdkBridge';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import { MgrShop, GoldPigShopId } from './MgrShop';
import { IAPTYPE, CYCLE_TYPE } from './Const';
import { IShopItemCmp } from './IShopItemCmp';
import { Tools } from './Tools';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';
import { IAPMgr } from './IAPMgr';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrGame } from './MgrGame';
import { MgrPig } from './MgrPig';
import { AssetPool } from './AssetPool';
import { BUNDLE_NAMES } from './AssetRes';
import { AsyncQueue } from './AsyncQueue';
import { GameConst } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('UIShopView')
export class UIShopView extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null!;

    @property(Node)
    listNode: Node = null!;

    @property(Widget)
    scrollViewWgt: Widget = null!;

    @property(Layout)
    scrollContent: Layout = null!;

    private _shopItems: IShopItemCmp[] = [];
    private _fromUi: string = '';
    private _scrollToNoAds: boolean = true;
    private _removeAdPackageNode: Node | null = null;
    private _createAsync: AsyncQueue = new AsyncQueue();

    public reuse(data?: any): void {
        if (data) {
            this._fromUi = data.fromUrl;
            this._scrollToNoAds = data.isScrollToNoAds;
        } else {
            this._fromUi = '';
            this._scrollToNoAds = true;
        }
    }

    onEnable(): void {
        const interactable = AppGame.topUI.backBtn.getComponent(Button)!.interactable;
        
        AppGame.topUI.addBackFunc(() => {
            this.onBackBtn();
            AppGame.topUI.setBtnEventEnable(AppGame.topUI.shopBtn.node, true);
            AppGame.topUI.showMain();
            
            if (this._fromUi === UIPrefabs.TopUI.url || this._fromUi === UIPrefabs.RemoveAdTip.url) {
                MgrUi.Instance.openViewAsync(UIPrefabs.CollectFreeGold);
            }
            
            this.scheduleOnce(() => {
                AppGame.topUI.setBtnEventEnable(AppGame.topUI.backBtn.node, interactable);
            }, 0);
        });

        AppGame.topUI.show(BTN_BACK | VALUE_COIN);
        AppGame.topUI.setBtnEventEnable(AppGame.topUI.shopBtn.node, false);
        
        this.scrollContent.paddingBottom = AppGame.inGame ? 100 : 10;
        this.scrollViewWgt.bottom = AppGame.inGame ? 100 : 10;
        
        IAPMgr.Instance.checkProductDetails();
        MgrShop.Instance.intoShopFlag = true;
        this._reportEvent();
        
        this._createAsync.clear();
        this._createAsync.push(this._createLimitedPackage.bind(this));
        this._createAsync.push(this._createPushGiftPackage.bind(this));
        this._createAsync.push(this._createNormalPackage.bind(this));
        this._createAsync.push(this._createTurnPackage.bind(this));
        this._createAsync.push(this._createCurrencyPackage.bind(this));
        this._createAsync.push(this._jumpToNoAdsItem.bind(this));
        
        this._createAsync.play();
    }

    onDisable(): void {
        this._removeAdPackageNode = null;
        this._shopItems.forEach(item => {
            AssetPool.Instance.put(item);
        });
        this._shopItems.length = 0;
        AppGame.topUI.lightningItem.hide();
        this._createAsync.clear();
    }

    private _reportEvent(): void {
        AnalyticsManager.getInstance().reportShopOpen({
            Level_Id: MgrGame.Instance.gameData.curLv
        });
    }

    private async _createLimitedPackage(next : Function): Promise<void> {
        const packageId = MgrShop.Instance.getLimitedPackageId();
        if (!packageId || MgrShop.Instance.checkLimitCycleBuyCntMax(packageId) || MgrShop.Instance.checkLimitBuyCntMax(packageId)) {
            next();
            return;
        }

        const cfg = ShopCfg.Instance.get(packageId);
        if (cfg.currency !== 99 && (!SdkBridge.checkCanPayment() || !IAPMgr.Instance.payReady)) {
            next();
            return;
        }

        if (cfg.iapType !== IAPTYPE.OneTimeConsumable && IAPMgr.Instance.checkProductOwned(cfg)) {
            next();
            return;
        }

        const prefab = MgrShop.Instance.getPrefabByType(cfg.prefabRes);
        const node = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, prefab.url);
        node.parent = this.listNode;
        
        const item = node.getComponent(IShopItemCmp)!;
        item.refreshInfo(cfg);
        item.delegate = this;
        this._shopItems.push(item);
        next();
    }

    private async _createPushGiftPackage(next : Function): Promise<void> {
        const nowTime = Tools.GetNowTime();
        const hasNoAd = MgrShop.Instance.isBuyNoAd();
        
        for (const packageId of ShopCfg.Instance.pushGiftPackages) {
            const cfg = ShopCfg.Instance.get(packageId);
            const buyData = MgrShop.Instance.getPackageBuyData(packageId);
            
            if (cfg.currency !== 99 && (!SdkBridge.checkCanPayment() || !IAPMgr.Instance.payReady)) {
                continue;
            }
            
            if ((cfg.limitBuyCnt !== 0 && buyData.buyCnt >= cfg.limitBuyCnt) || 
                (hasNoAd && GameConst.REMOVE_ADS_PACKIDS.includes(cfg.id))) {
                continue;
            }
            
            if (cfg.iapType !== IAPTYPE.OneTimeConsumable && IAPMgr.Instance.checkProductOwned(cfg)) {
                continue;
            }
            
            if (cfg.limitCycleType !== CYCLE_TYPE.None) {
                if (cfg.limitCycleBuyCnt !== 0 && buyData.cycleBuyCnt >= cfg.limitCycleBuyCnt) {
                    continue;
                }
                if ((buyData?.closeTime || 0) <= nowTime) {
                    continue;
                }
            }
            
            const node = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, UIPrefabs.ShopItemGiftPush.url);
            node.parent = this.listNode;
            
            const item = node.getComponent(IShopItemCmp)!;
            item.refreshInfo(cfg);
            item.delegate = this;
            this._shopItems.push(item);
        }
        next();
    }

    private async _createNormalPackage(next : Function): Promise<void> {
        const hasNoAd = MgrShop.Instance.isBuyNoAd();
        const nowTime = Tools.GetNowTime();
        
        for (const packageId of ShopCfg.Instance.normalPackages) {
            const cfg = ShopCfg.Instance.get(packageId);
            const buyData = MgrShop.Instance.getPackageBuyData(packageId);
            
            if (cfg.currency !== 99 && (!SdkBridge.checkCanPayment() || !IAPMgr.Instance.payReady)) {
                continue;
            }
            
            if ((cfg.id === GoldPigShopId && !MgrPig.Instance.isGoldBankOpen()) ||
                (cfg.limitBuyCnt !== 0 && buyData.buyCnt >= cfg.limitBuyCnt) ||
                (hasNoAd && GameConst.REMOVE_ADS_PACKIDS.includes(cfg.id))) {
                continue;
            }
            
            if (cfg.iapType !== IAPTYPE.OneTimeConsumable && IAPMgr.Instance.checkProductOwned(cfg)) {
                continue;
            }
            
            if (cfg.limitCycleType !== CYCLE_TYPE.None) {
                if (cfg.limitCycleBuyCnt !== 0 && buyData.cycleBuyCnt >= cfg.limitCycleBuyCnt) {
                    continue;
                }
                if ((buyData?.closeTime || 0) <= nowTime) {
                    continue;
                }
            }
            
            const prefab = MgrShop.Instance.getPrefabByType(cfg.prefabRes);
            const node = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, prefab.url);
            node.parent = this.listNode;
            
            const item = node.getComponent(IShopItemCmp)!;
            item.refreshInfo(cfg);
            item.delegate = this;
            
            if (GameConst.REMOVE_ADS_PACKIDS.includes(cfg.id)) {
                this._removeAdPackageNode = node;
            }
            
            this._shopItems.push(item);
        }
        next();
    }

    private async _createTurnPackage(next : Function): Promise<void> {
        const packageId = MgrShop.Instance.getTurnPackageId();
        if (!packageId || MgrShop.Instance.checkLimitCycleBuyCntMax(packageId) || MgrShop.Instance.checkLimitBuyCntMax(packageId)) {
            next();
            return;
        }

        const cfg = ShopCfg.Instance.get(packageId);
        if (cfg.currency !== 99 && (!SdkBridge.checkCanPayment() || !IAPMgr.Instance.payReady)) {
            next();
            return;
        }

        if (cfg.iapType !== IAPTYPE.OneTimeConsumable && IAPMgr.Instance.checkProductOwned(cfg)) {
            next();
            return;
        }

        const prefab = MgrShop.Instance.getPrefabByType(cfg.prefabRes);
        const node = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, prefab.url);
        node.parent = this.listNode;
        
        const item = node.getComponent(IShopItemCmp)!;
        item.refreshInfo(cfg);
        item.delegate = this;
        this._shopItems.push(item);
        next();
    }

    private async _createCurrencyPackage(next : Function): Promise<void> {
        const nowTime = Tools.GetNowTime();
        
        for (const packageId of ShopCfg.Instance.currencyPackages) {
            const cfg = ShopCfg.Instance.get(packageId);
            const buyData = MgrShop.Instance.getPackageBuyData(packageId);
            
            if (cfg.currency !== 99 && (!SdkBridge.checkCanPayment() || !IAPMgr.Instance.payReady)) {
                continue;
            }
            
            if (cfg.limitBuyCnt !== 0 && buyData.buyCnt >= cfg.limitBuyCnt) {
                continue;
            }
            
            if (cfg.iapType !== IAPTYPE.OneTimeConsumable && IAPMgr.Instance.checkProductOwned(cfg)) {
                continue;
            }
            
            if (cfg.limitCycleType !== CYCLE_TYPE.None) {
                if (cfg.limitCycleBuyCnt !== 0 && buyData.cycleBuyCnt >= cfg.limitCycleBuyCnt) {
                    continue;
                }
                if ((buyData?.closeTime || 0) <= nowTime) {
                    continue;
                }
            }
            
            const prefab = MgrShop.Instance.getPrefabByType(cfg.prefabRes);
            const node = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, prefab.url);
            node.parent = this.listNode;
            
            const item = node.getComponent(IShopItemCmp)!;
            item.refreshInfo(cfg);
            item.delegate = this;
            this._shopItems.push(item);
            next();
        }
    }

    private _jumpToNoAdsItem(next : Function): void {
        if (this._scrollToNoAds && this._removeAdPackageNode) {
            this.scrollContent.updateLayout(true);
            const offsetY = -this._removeAdPackageNode.position.y - view.getVisibleSize().height / 2;
            this.scrollView.scrollToOffset(Vec2.ZERO.set(0, offsetY), 0.32);
        }
        next();
    }

    private onBackBtn(): void {
        this.getComponent(ViewAnimCtrl)!.onClose();
    }

    private onShopItemGiveAfter(item: IShopItemCmp): void {
        const shopId = item.getShopId();
        
        if (GameConst.REMOVE_ADS_PACKIDS.includes(shopId)) {
            for (const shopItem of this._shopItems) {
                const itemShopId = shopItem.getShopId();
                if (GameConst.REMOVE_ADS_PACKIDS.includes(itemShopId)) {
                    AssetPool.Instance.put(shopItem);
                    const index = this._shopItems.indexOf(shopItem);
                    if (index >= 0) {
                        this._shopItems.splice(index, 1);
                    }
                }
            }
        } else if (MgrShop.Instance.checkLimitBuyCntMax(shopId)) {
            AssetPool.Instance.put(item);
            const index = this._shopItems.indexOf(item);
            if (index >= 0) {
                this._shopItems.splice(index, 1);
            }
        } else if (MgrShop.Instance.checkLimitCycleBuyCntMax(shopId)) {
            AssetPool.Instance.put(item);
            const index = this._shopItems.indexOf(item);
            if (index >= 0) {
                this._shopItems.splice(index, 1);
            }
        }
    }
}