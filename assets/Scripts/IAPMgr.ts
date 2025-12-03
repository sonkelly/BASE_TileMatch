import { _decorator, Component, cclegacy, macro, director, find } from 'cc';
import {channelManager, ChannelType } from './ChannelManager';
import { FaceBookPayMgr } from './FaceBookPayMgr';
import {ShopCfg} from './ShopCfg';
import { MgrShop } from './MgrShop';
import { AnalyticsManager } from './AnalyticsManager';
import { GlobalEvent } from './Events';
import {Loading} from './Loading';

const { ccclass, property } = _decorator;

@ccclass('IAPMgr')
export class IAPMgr extends Component {
    private static _ins: IAPMgr | null = null;
    public static get Instance(): IAPMgr {
        if (!this._ins) {
            this._ins = find('App')!.addComponent(IAPMgr);
        }
        return this._ins;
    }

    public payReady: boolean = true;
    private _platform: any = null;

    start() {
        this.schedule(this._fixedUpdate, 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _fixedUpdate(dt: number) {
        this.checkPollingValidate(dt);
    }

    init() {
        if (channelManager.getChannelType() == ChannelType.FaceBook) {
            this._platform = new FaceBookPayMgr();
        }
        if (this._platform && this._platform.init) {
            this._platform.init();
        }
    }

    isIAPStoreEnabled(): boolean {
        return !this._platform || this._platform.isIAPStoreEnabled();
    }

    onQueryProductDetailsCallBack(data: any) {
        if (this._platform && this._platform.onQueryProductDetailsCallBack) {
            this._platform.onQueryProductDetailsCallBack(data);
        }
        director.emit(GlobalEvent.shopRefreshProductDetails);
    }

    onRestorePurchasesCallBack(data: any) {
        if (this._platform && this._platform.onRestorePurchasesCallBack) {
            this._platform.onRestorePurchasesCallBack(data);
        }
    }

    onBuyProductDetailsCallBack(data: any) {
        Loading.close();
        if (this._platform && this._platform.onBuyProductDetailsCallBack) {
            this._platform.onBuyProductDetailsCallBack(data);
        }
    }

    onPurchaseCallBack(data: string) {
        const jsonData = JSON.parse(data);
        const productId = jsonData.productId;
        const orderId = jsonData.orderId;
        const quantity = jsonData.quantity;
        MgrShop.Instance.buyPackage(productId, orderId, quantity);
    }

    onConsumablePurchaseCallBack(data: string) {
        const jsonData = JSON.parse(data);
        const productId = jsonData.productId;
        const orderId = jsonData.orderId;
        const quantity = jsonData.quantity;
        MgrShop.Instance.buyPackage(productId, orderId, quantity);
    }

    onNoConsumablePurchaseCallBack(data: string) {
        const jsonData = JSON.parse(data);
        const productId = jsonData.productId;
        const orderId = jsonData.orderId;
        MgrShop.Instance.buyPackage(productId, orderId, 1);
    }

    onSubscriptionPurchaseCallBack(data: string) {
        const jsonData = JSON.parse(data);
        const productId = jsonData.productId;
        const orderId = jsonData.orderId;
        MgrShop.Instance.buyPackage(productId, orderId, 1);
    }

    checkProductDetails() {
        if (this._platform) {
            if (this._platform.checkProductDetailsisEmpty && this._platform.checkProductDetailsisEmpty()) {
                this._platform.queryProductDetails();
            }
        }
    }

    handlePurchases() {
        if (this._platform && this._platform.handlePurchases) {
            this._platform.handlePurchases();
        }
    }

    checkProductOwned(productId: string): boolean {
        return !!this._platform && this._platform.checkProductOwned && this._platform.checkProductOwned(productId);
    }

    getProductPrice(product: any): string {
        return this._platform ? this._platform.getProductPrice(product) : '$ ' + product.cost;
    }

    getdeletePrice(product: any): string {
        return this._platform ? this._platform.getdeletePrice(product) : '$ ' + (product.cost / product.off).toFixed(2);
    }

    purchaseProduct(product: any) {
        if (this._platform) {
            const productId = this._platform.purchaseProduct(product);
            AnalyticsManager.getInstance().reportShopBuy({
                Commodity_ID: productId,
                Shop_ID: product.id
            });
        } else {
            MgrShop.Instance.givenShopReward(product.andIapId, '', product, 1);
            Loading.close();
        }
    }

    onValidatePurchase(data: string) {
        console.log('googlePay IAPMgr onValidatePurchase param:', data);
        const jsonData = JSON.parse(data);
        const productId = jsonData.productId;
        const purchaseToken = jsonData.purchaseToken;
        const orderId = jsonData.orderId;
        const shopId = ShopCfg.Instance.getCfgByProductId(productId).id;
        
        if (this._platform && this._platform.validatePurchase) {
            this._platform.validatePurchase(shopId, orderId, purchaseToken);
        }
    }

    checkValidateShopInfos() {
        if (this._platform && this._platform.checkValidateShopInfos) {
            this._platform.checkValidateShopInfos();
        }
    }

    checkPollingValidate(dt: number) {
        if (this._platform && this._platform.checkPollingValidate) {
            this._platform.checkPollingValidate(dt);
        }
    }
}