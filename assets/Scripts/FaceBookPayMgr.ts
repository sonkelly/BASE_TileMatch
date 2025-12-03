import { _decorator, cclegacy } from 'cc';
import { ShopCurrency, IAPTYPE } from './Const';
import { MgrService } from './MgrService';
import { ShopCfg } from './ShopCfg';
import { MgrShop } from './MgrShop';
import { Utils } from './Utils';
import { SdkBridge } from './SdkBridge';
import { HttpService } from './HttpService';
import { Language } from './Language';
import { StorageProxy } from './StorageProxy';
import { Loading } from './Loading';
import { Toast } from './Toast';
import { IAPMgr } from './IAPMgr';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

enum PollingStatus {
    Idle = 1,
    Request = 2
}

const STORAGE_KEY = 'CK_BuyShopInfos';

@ccclass('FaceBookPayMgr')
export class FaceBookPayMgr {
    private _consumableProductIds: string[] = [];
    private _noConsumableProductIds: string[] = [];
    private _subsProductIds: string[] = [];
    private _productDetails: Map<string, any> = new Map();
    private _restorePurchases: any[] = [];
    private _buyShopInfos: Record<string, any> = {};
    private _pollingArr: any[] = [];

    public init(): void {
        const shopCfgs = ShopCfg.Instance.cfg;
        
        each(shopCfgs, (cfg) => {
            if (cfg.currency === ShopCurrency.Cash) {
                switch (cfg.iapType) {
                    case IAPTYPE.OneTimeConsumable:
                        this._consumableProductIds.push(cfg.andIapId);
                        break;
                    case IAPTYPE.OneTimeNoConsumable:
                        this._noConsumableProductIds.push(cfg.andIapId);
                        break;
                    case IAPTYPE.Subscription:
                        this._subsProductIds.push(cfg.andIapId);
                        break;
                    default:
                        console.error('no match iapType:', cfg.iapType);
                }
            }
        });

        this._loadBuyShopInfo();
        IAPMgr.Instance.payReady = true;

        if (SdkBridge.checkCanPayment() && SdkBridge.checkPayOnReady(() => {
            this.tryCostConsume();
            IAPMgr.Instance.payReady = false;
        })) {
            SdkBridge.getCatalogAsync().then((catalog) => {
                catalog.forEach((product) => {
                    this._productDetails.set(product.productID, {
                        price: product.price,
                        productId: product.productID,
                        description: product.description,
                        priceAmount: product.priceAmount,
                        priceCurrencyCode: product.priceCurrencyCode,
                        title: product.title
                    });
                });
            });
        }

        this.queryProductDetails();
    }

    public tryCostConsume(): void {
        SdkBridge.checkPurchaseCost().then((purchases) => {
            for (const purchase of purchases) {
                const shopCfg = ShopCfg.Instance.getCfgByProductId(purchase.productID);
                if (shopCfg && shopCfg.iapType === IAPTYPE.OneTimeConsumable) {
                    this._addBuyShopInfo(shopCfg.id, purchase.purchaseToken, purchase.paymentID);
                    this.validatePurchase(shopCfg.id, purchase.paymentID, purchase.signedRequest, purchase.purchaseToken);
                }
            }
        });
    }

    public checkProductDetailsisEmpty(): boolean {
        return false;
    }

    public checkProductOwned(productId: string): boolean {
        return false;
    }

    public checkValidateShopInfos(): void {}

    public getProductPrice(product: any): string {
        const productDetail = this._productDetails.get(product.FBIapId);
        return productDetail ? productDetail.price : `$${product.cost.toString()}`;
    }

    public getdeletePrice(product: any): string {
        const productDetail = this._productDetails.get(product.FBIapId);
        if (!productDetail) {
            return `$${(product.cost / product.off).toFixed(2)}`;
        }

        const priceAmount = Number(productDetail.priceAmount) || 0;
        const currencySymbol = productDetail ? Utils.extractNonNumericCharacters(productDetail.price) : '';
        let result = '';
        const discount = product.off || 1;

        if (priceAmount > 0) {
            result = `${currencySymbol} ${(priceAmount / discount).toFixed(2)}`;
        }

        return result;
    }

    public handlePurchases(): void {}

    public isIAPStoreEnabled(): boolean {
        return SdkBridge.checkCanPurchase();
    }

    public onBuyProductDetailsCallBack(product: any): void {}

    public onQueryProductDetailsCallBack(products: any[]): void {}

    public onRestorePurchasesCallBack(purchases: any[]): void {}

    public purchaseProduct(product: any): string {
        const purchaseRequest = {
            productID: product.FBIapId
        };

        FBInstant.payments.purchaseAsync(purchaseRequest)
            .then((result) => {
                this._addBuyShopInfo(product.id, result.purchaseToken, result.paymentID);
                this.validatePurchase(product.id, result.paymentID, result.signedRequest, result.purchaseToken);
            })
            .catch(() => {
                Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
                Loading.close();
            });

        return product.FBIapId;
    }

    private _addBuyShopInfo(shopId: string, token: string, orderId: string): void {
        if (!this._checkOwnShopInfo(token)) {
            this._buyShopInfos[token] = {
                shopId: shopId,
                token: token,
                orderId: orderId
            };
            StorageProxy.setItem(STORAGE_KEY, this._buyShopInfos);
        }
    }

    private _loadBuyShopInfo(): void {
        this._buyShopInfos = StorageProxy.getItem(STORAGE_KEY, {});
    }

    private _checkOwnShopInfo(token: string): boolean {
        return this._buyShopInfos.hasOwnProperty(token);
    }

    private _removeBuyShopInfo(token: string): void {
        if (this._buyShopInfos.hasOwnProperty(token)) {
            delete this._buyShopInfos[token];
            StorageProxy.setItem(STORAGE_KEY, this._buyShopInfos);
        }
    }

    public queryProductDetails(): void {}

    private async _validatePurchaseSucc(shopId: string, orderId: string, token: string, quantity: number, firstConsume: boolean): Promise<void> {
        console.log('googlePay GooglePayMgr validatePurchaseSucc shopId:' + shopId);
        
        if (this._checkOwnShopInfo(token)) {
            const shopCfg = ShopCfg.Instance.get(shopId);
            const productId = ShopCfg.Instance.getProductIdById(shopId);
            
            if (shopCfg.iapType === IAPTYPE.OneTimeConsumable) {
                try {
                    await SdkBridge.costPurchase(token);
                    MgrShop.Instance.givenShopReward(productId, orderId, shopCfg, quantity);
                    this._removeBuyShopInfo(token);
                } catch (error) {
                    setTimeout(() => {
                        this._validatePurchaseSucc(shopId, orderId, token, quantity, firstConsume);
                    }, 5000);
                }
            }
            
            Loading.close();
        }
    }

    private async validatePurchase(shopId: string, orderId: string, signedRequest: string, purchaseToken: string): Promise<void> {
        const appId = MgrService.Instance.appid;
        const result = await HttpService.Instance.validatePurchase(appId, shopId, orderId, signedRequest);
        
        if (result) {
            const code = result.code;
            const msg = result.msg;
            console.log('googlePay GooglePayMgr validatePurchase. code: ' + code + ', msg: ' + msg);
            
            if (code === 200) {
                const data = result.data;
                this._validatePurchaseSucc(data.shopId, data.orderId, purchaseToken, data.quantity, data.firstConsume);
            } else {
                Loading.close();
                Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
            }
        } else {
            this._addPolling(shopId, orderId, signedRequest, purchaseToken);
        }
    }

    private _addPolling(shopId: string, orderId: string, signedRequest: string, purchaseToken: string): void {
        let index = -1;
        
        for (let i = 0; i < this._pollingArr.length; i++) {
            if (this._pollingArr[i].signedRequest === signedRequest) {
                index = i;
                break;
            }
        }
        
        if (index === -1) {
            this._pollingArr.push({
                time: 0,
                status: PollingStatus.Idle,
                shopId: shopId,
                orderId: orderId,
                signedRequest: signedRequest,
                purchaseToken: purchaseToken
            });
            console.log('googlePay GooglePayMgr addPolling finish. length:' + this._pollingArr.length);
        }
    }

    private _removePollingByShopId(signedRequest: string): void {
        let index = -1;
        
        for (let i = 0; i < this._pollingArr.length; i++) {
            if (this._pollingArr[i].signedRequest === signedRequest) {
                index = i;
                break;
            }
        }
        
        if (index >= 0) {
            this._pollingArr.splice(index, 1);
            console.log('googlePay GooglePayMgr removePollingByShopId finish. length: ' + this._pollingArr.length);
        }
    }

    public checkPollingValidate(deltaTime: number): void {
        if (this._pollingArr.length > 0) {
            for (const item of this._pollingArr) {
                if (item.status !== PollingStatus.Request) {
                    item.time += deltaTime;
                    
                    if (item.time >= 3) {
                        item.time = 0;
                        this._pollingValidatePurchase(item);
                    }
                }
            }
        }
    }

    private async _pollingValidatePurchase(item: any): Promise<void> {
        item.status = PollingStatus.Request;
        const appId = MgrService.Instance.appid;
        const shopId = item.shopId;
        const orderId = item.orderId;
        const signedRequest = item.signedRequest;
        const purchaseToken = item.purchaseToken;
        
        console.log('googlePay GooglePayMgr pollingValidatePurchase shopId:' + shopId + ', orderId: ' + orderId + ', signedRequest: ' + signedRequest);
        
        const result = await HttpService.Instance.validatePurchase(appId, shopId, orderId, signedRequest);
        
        if (result) {
            const code = result.code;
            const msg = result.msg;
            console.log('googlePay GooglePayMgr pollingValidatePurchase. code: ' + code + ', msg: ' + msg);
            
            this._removePollingByShopId(signedRequest);
            
            if (code === 200) {
                const data = result.data;
                this._validatePurchaseSucc(data.shopId, data.orderId, purchaseToken, data.quantity, data.firstConsume);
            } else {
                Loading.close();
                Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
            }
        } else {
            item.status = PollingStatus.Idle;
        }
    }
}