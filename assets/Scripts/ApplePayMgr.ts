import { _decorator, native } from 'cc';
import {each} from 'lodash-es';
import { ShopCfg } from './ShopCfg';
import { IAPTYPE } from './Const';
import {Toast} from './Toast';
import {Language} from './Language';

const { ccclass } = _decorator;

@ccclass('ApplePayMgr')
export class ApplePayMgr {
    private _productIds: string[] = [];
    private _productDetails: Map<string, any> = new Map();
    private _restorePurchases: string[] = [];

    public init(): void {
        const cfg = ShopCfg.Instance.cfg;
        each(cfg, (item: any) => {
            switch (item.iapType) {
                case IAPTYPE.OneTimeConsumable:
                case IAPTYPE.OneTimeNoConsumable:
                    this._productIds.push(item.iosIapId);
                    break;
                default:
                    console.error('no match iapType:', item.iapType);
            }
        });
        this.initScript();
        this.restorePurchases();
        this.queryProductDetails();
    }

    public isIAPStoreEnabled(): boolean {
        return true;
    }

    private initScript(): void {
        const ic = 'SDKBridge';
        const config = {
            QueryProductDetailsCallBack: 'onQueryDetailsCallBack',
            RestorePurchasesCallBack: 'onRestorePurchasesCallBack',
            BuyProductDetailsCallBack: 'onBuyProductDetailsCallBack',
            PurchaseCallBack: 'onPurchaseCallBack',
            productIds: this._productIds.join(',')
        };
        const jsonStr = JSON.stringify(config);
        native.reflection.callStaticMethod(ic, 'initPurchasesScript:', jsonStr);
    }

    public handlePurchases(): void {
        native.reflection.callStaticMethod('SDKBridge', 'handlePurchases');
    }

    public restorePurchases(): void {
        native.reflection.callStaticMethod('SDKBridge', 'restorePurchases');
    }

    public queryProductDetails(): void {
        native.reflection.callStaticMethod('SDKBridge', 'queryProductDetails');
    }

    public purchaseProduct(product: any): string {
        const productId = product.iosIapId;
        const purchaseData = { productId };
        const jsonStr = JSON.stringify(purchaseData);
        native.reflection.callStaticMethod('SDKBridge', 'purchaseProduct:', jsonStr);
        return productId;
    }

    public checkProductDetailsisEmpty(): boolean {
        return this._productDetails.size <= 0;
    }

    public checkProductOwned(product: any): boolean {
        return this._restorePurchases.includes(product.iosIapId);
    }

    public getProductPrice(product: any): string {
        const productDetail = this._productDetails.get(product.iosIapId);
        return productDetail?.price || '';
    }

    public getdeletePrice(product: any): string {
        const productDetail = this._productDetails.get(product.andIapId);
        const priceAmount = Number(productDetail?.priceAmount) || 0;
        const currencyCode = productDetail?.priceCurrencyCode || '';
        const discount = product.off || 1;
        
        if (priceAmount > 0) {
            const discountedPrice = (priceAmount / discount).toFixed(2);
            return `${currencyCode} ${discountedPrice}`;
        }
        return '';
    }

    public onQueryProductDetailsCallBack(jsonStr: string): void {
        const data = JSON.parse(jsonStr);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const productDetail = JSON.parse(data[key]);
                this._productDetails.set(key, productDetail);
            }
        }
    }

    public onRestorePurchasesCallBack(jsonStr: string): void {
        console.log('ApplePay onRestorePurchasesCallBack jsonObjStr:', jsonStr);
        const productIds = JSON.parse(jsonStr).productIds.split(',');
        this._restorePurchases.push(...productIds);
    }

    public onBuyProductDetailsCallBack(result: any): void {
        Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
    }

    public async validatePurchase(hW: any, hX: any, hY: any) {

    };

    public checkValidateShopInfos(): void {}

    public checkPollingValidate(ie: any): void {}
}