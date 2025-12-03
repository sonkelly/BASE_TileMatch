import { _decorator, native, director, sys, cclegacy } from 'cc';
import {each,isEmpty} from 'lodash-es';
import {ShopCfg} from './ShopCfg';
import { ShopCurrency, IAPTYPE } from './Const';
import {Toast} from './Toast';
import {Language} from './Language';
import { MgrService } from './MgrService';
import { HttpService, PurchaseState } from './HttpService';
import { config } from './Config';
import { MgrShop } from './MgrShop';
import {Utils} from './Utils';
import { GlobalEvent } from './Events';

const { ccclass } = _decorator;

enum BillingResponseCode {
    FEATURE_NOT_SUPPORTED = -2,
    SERVICE_DISCONNECTED = -1,
    OK = 0,
    USER_CANCELED = 1,
    SERVICE_UNAVAILABLE = 2,
    BILLING_UNAVAILABLE = 3,
    ITEM_UNAVAILABLE = 4,
    DEVELOPER_ERROR = 5,
    ERROR = 6,
    ITEM_ALREADY_OWNED = 7,
    ITEM_NOT_OWNED = 8,
    NETWORK_ERROR = 12
}

enum PollingStatus {
    Idle = 1,
    Request = 2
}

const GOOGLE_PAY_KEY = 'googlePay';
const SDK_BRIDGE_CLASS = 'com/cocos/game/SdkBrigde';
const BUY_SHOP_INFOS_KEY = 'BuyShopInfos';

@ccclass('GooglePayMgr')
export class GooglePayMgr {
    private _consumableProductIds: string[] = [];
    private _noConsumableProductIds: string[] = [];
    private _subsProductIds: string[] = [];
    private _productDetails: Map<string, any> = new Map();
    private _restorePurchases: string[] = [];
    private _buyShopInfos: { [key: string]: any } = {};
    private _pollingArr: any[] = [];

    public init(): void {
        const cfg = ShopCfg.Instance.cfg;
        each(cfg, (item: any) => {
            if (item.currency === ShopCurrency.Cash) {
                switch (item.iapType) {
                    case IAPTYPE.OneTimeConsumable:
                        this._consumableProductIds.push(item.andIapId);
                        break;
                    case IAPTYPE.OneTimeNoConsumable:
                        this._noConsumableProductIds.push(item.andIapId);
                        break;
                    case IAPTYPE.Subscription:
                        this._subsProductIds.push(item.andIapId);
                        break;
                    default:
                        console.error('no match iapType:', item.iapType);
                }
            }
        });

        this.initScript();
        this.restorePurchases();
        this.queryProductDetails();
        this._deserializedShopInfos();
    }

    public isIAPStoreEnabled(): boolean {
        return native.reflection.callStaticMethod(SDK_BRIDGE_CLASS, 'isConnectedToGooglePlay', '()Z');
    }

    public initScript(): void {
        const scriptData = {
            QueryProductDetailsCallBack: 'onQueryProductDetailsCallBack',
            RestorePurchasesCallBack: 'onRestorePurchasesCallBack',
            BuyProductDetailsCallBack: 'onBuyProductDetailsCallBack',
            ConsumablePurchaseCallBack: 'onConsumablePurchaseCallBack',
            NoConsumablePurchaseCallBack: 'onNoConsumablePurchaseCallBack',
            SubscriptionPurchaseCallBack: 'onSubscriptionPurchaseCallBack',
            ValidatePurchase: 'onValidatePurchase',
            consumableProductIds: this._consumableProductIds.join(','),
            noConsumableProductIds: this._noConsumableProductIds.join(','),
            subsProductIds: this._subsProductIds.join(',')
        };

        const jsonStr = JSON.stringify(scriptData);
        native.reflection.callStaticMethod(SDK_BRIDGE_CLASS, 'initScript', '(Ljava/lang/String;)V', jsonStr);
    }

    public handlePurchases(): void {
        native.reflection.callStaticMethod(SDK_BRIDGE_CLASS, 'handlePurchases', '()V');
    }

    public restorePurchases(): void {
        native.reflection.callStaticMethod(SDK_BRIDGE_CLASS, 'restorePurchases', '()V');
    }

    public queryProductDetails(): void {
        native.reflection.callStaticMethod(SDK_BRIDGE_CLASS, 'queryProductDetails', '()V');
    }

    public purchaseProduct(item: any): string {
        const productId = item.andIapId;
        const purchaseData = {
            productId: productId,
            price: '' + item.cost
        };

        const jsonStr = JSON.stringify(purchaseData);
        native.reflection.callStaticMethod(SDK_BRIDGE_CLASS, 'purchaseProduct', '(Ljava/lang/String;)V', jsonStr);
        
        return productId;
    }

    public checkProductDetailsisEmpty(): boolean {
        return this._productDetails.size <= 0;
    }

    public checkProductOwned(item: any): boolean {
        return this._restorePurchases.includes(item.andIapId);
    }

    public getProductPrice(item: any): string {
        const productDetail = this._productDetails.get(item.andIapId);
        return productDetail?.price || '$ ' + item.cost;
    }

    public getdeletePrice(item: any): string {
        const productDetail = this._productDetails.get(item.andIapId);
        let priceAmount = Number(productDetail?.priceAmount || 0);
        let price = productDetail?.price || '$ ' + item.cost;
        const discount = item.off || 1;
        let currencySymbol = '';

        if (priceAmount > 0) {
            priceAmount = priceAmount / 1000000 / discount;
            currencySymbol = Utils.extractNonNumericCharacters(price);
        } else {
            priceAmount = item.cost / discount;
            currencySymbol = '$';
        }

        return '' + currencySymbol + (priceAmount / 100 >= 1 ? priceAmount.toFixed(0) : priceAmount.toFixed(2));
    }

    public onQueryProductDetailsCallBack(jsonStr: string): void {
        const productDetails = JSON.parse(jsonStr);
        for (const productId in productDetails) {
            if (productDetails.hasOwnProperty(productId)) {
                const productDetail = JSON.parse(productDetails[productId]);
                this._productDetails.set(productId, productDetail);
            }
        }
    }

    public onRestorePurchasesCallBack(jsonStr: string): void {
        console.log(GOOGLE_PAY_KEY + ' onRestorePurchasesCallBack jsonObjStr:', jsonStr);
        const productIds = JSON.parse(jsonStr).productIds.split(',');
        this._restorePurchases.push(...productIds);
    }

    public onBuyProductDetailsCallBack(jsonStr: string): void {
        const result = JSON.parse(jsonStr);
        const responseCode = Number(result.responseCode);
        
        console.log(GOOGLE_PAY_KEY + ' onBuyProductDetailsCallBack responseCode:', responseCode);
        
        if (responseCode !== BillingResponseCode.OK) {
            Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
            director.emit(GlobalEvent.inAppPurchaseFail);
        }
    }

    public async validatePurchase (this: GooglePayMgr, shopId: string, orderId: string, token: string) {
        console.log('googlePay GooglePayMgr validatePurchase shopId:' + shopId + ', orderId: ' + orderId + ', token: ' + token);
        
        this._addBuyShopInfo(shopId, token, orderId);
        
        const appId = MgrService.Instance.appid;
        const result = await HttpService.Instance.validatePurchase(appId, shopId, orderId, token);
        
        if (result) {
            const code = result.code;
            const msg = result.msg;
            
            console.log('googlePay GooglePayMgr validatePurchase. code: ' + code + ', msg: ' + msg);
            
            if (code === 200) {
                const data = result.data;
                if (data.purchaseState === PurchaseState.Purchased) {
                    this._validatePurchaseSucc(data.shopId, data.orderId, token, data.quantity, data.firstConsume);
                    return;
                }
                if (data.purchaseState === PurchaseState.Canceled) {
                    this._removeBuyShopInfo(token);
                    return;
                }
            }
        } else {
            this._addPolling(shopId, orderId, token);
        }
    }

    private async _pollingValidatePurchase(self: GooglePayMgr, pollingItem: any) {
        pollingItem.status = PollingStatus.Request;
        
        const appId = MgrService.Instance.appid;
        const shopId = pollingItem.shopId;
        const orderId = pollingItem.orderId;
        const token = pollingItem.token;
        
        console.log('googlePay GooglePayMgr pollingValidatePurchase shopId:' + shopId + ', orderId: ' + orderId + ', token: ' + token);
        
        const result = await HttpService.Instance.validatePurchase(appId, shopId, orderId, token);
        
        if (result) {
            const code = result.code;
            const msg = result.msg;
            
            console.log('googlePay GooglePayMgr pollingValidatePurchase. code: ' + code + ', msg: ' + msg);
            
            self._removePollingByShopId(token);
            
            if (code === 200) {
                const data = result.data;
                if (data.purchaseState === PurchaseState.Purchased) {
                    self._validatePurchaseSucc(data.shopId, data.orderId, token, data.quantity, data.firstConsume);
                    return;
                }
                if (data.purchaseState === PurchaseState.Canceled) {
                    self._removeBuyShopInfo(token);
                    return;
                }
            }
        } else {
            pollingItem.status = PollingStatus.Idle;
        }
    }

    private _validatePurchaseSucc(shopId: string, orderId: string, token: string, quantity: number, firstConsume: boolean): void {
        console.log('googlePay GooglePayMgr validatePurchaseSucc shopId:' + shopId);
        
        const shopItem = ShopCfg.Instance.get(shopId);
        const productId = ShopCfg.Instance.getProductIdById(shopId);
        
        if (this._checkOwnShopInfo(token)) {
            MgrShop.Instance.givenShopReward(productId, orderId, shopItem, quantity);
            this._removeBuyShopInfo(token);
        }
    }

    private _addBuyShopInfo(shopId: string, token: string, orderId: string): void {
        if (!this._checkOwnShopInfo(token)) {
            this._buyShopInfos[token] = {
                shopId: shopId,
                token: token,
                orderId: orderId
            };
            
            console.log('googlePay GooglePayMgr addBuyShopInfo token:' + token);
            this._serializeShopInfos();
        }
    }

    private _checkOwnShopInfo(token: string): boolean {
        return this._buyShopInfos.hasOwnProperty(token);
    }

    private _removeBuyShopInfo(token: string): void {
        if (this._buyShopInfos.hasOwnProperty(token)) {
            delete this._buyShopInfos[token];
            console.log('googlePay GooglePayMgr removeBuyShopInfo token:' + token);
            this._serializeShopInfos();
        }
    }

    private _serializeShopInfos(): void {
        const jsonStr = JSON.stringify(this._buyShopInfos);
        sys.localStorage.setItem(config.gameName + '-' + BUY_SHOP_INFOS_KEY, jsonStr);
    }

    private _deserializedShopInfos(): void {
        const jsonStr = sys.localStorage.getItem(config.gameName + '-' + BUY_SHOP_INFOS_KEY);
        if (!isEmpty(jsonStr)) {
            try {
                this._buyShopInfos = JSON.parse(jsonStr!);
            } catch (error) {
                this._buyShopInfos = {};
            }
        }
    }

    public checkValidateShopInfos(): void {
        console.log('googlePay GooglePayMgr checkValidateShopInfos.');
        
        if (!isEmpty(this._buyShopInfos)) {
            each(this._buyShopInfos, (info: any, token: string) => {
                this.validatePurchase(info.shopId, info.orderId, info.token);
            });
        }
    }

    private _addPolling(shopId: string, orderId: string, token: string): void {
        let index = -1;
        
        for (let i = 0; i < this._pollingArr.length; i++) {
            if (this._pollingArr[i].token === token) {
                index = i;
                break;
            }
        }
        
        if (index === -1) {
            const status = PollingStatus.Idle;
            this._pollingArr.push({
                time: 0,
                status: status,
                shopId: shopId,
                orderId: orderId,
                token: token
            });
            
            console.log('googlePay GooglePayMgr addPolling finish. length:' + this._pollingArr.length);
        }
    }

    private _removePollingByShopId(token: string): void {
        let index = -1;
        
        for (let i = 0; i < this._pollingArr.length; i++) {
            if (this._pollingArr[i].token === token) {
                index = i;
                break;
            }
        }
        
        if (index >= 0) {
            this._pollingArr.splice(index, 1);
            console.log('googlePay GooglePayMgr removePollingByShopId finish. length: ' + this._pollingArr.length);
        }
    }

    public checkPollingValidate(dt: number): void {
        if (this._pollingArr.length <= 0) return;
        
        for (let i = 0; i < this._pollingArr.length; i++) {
            const pollingItem = this._pollingArr[i];
            
            if (pollingItem.status !== PollingStatus.Request) {
                pollingItem.time += dt;
                
                if (pollingItem.time >= 3) {
                    pollingItem.time = 0;
                    this._pollingValidatePurchase(pollingItem);
                }
            }
        }
    }
}