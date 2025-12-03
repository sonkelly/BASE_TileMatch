import { _decorator, Component, sys, cclegacy } from 'cc';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrShop } from './MgrShop';

const { ccclass, property } = _decorator;

@ccclass('IShopItemCmp')
export class IShopItemCmp extends Component {
    public _cfg: any = null;
    public delegate: any = undefined;

    public getShopId(): string {
        return this._cfg.id;
    }

    public reportShopItemClick(itemConfig: any): void {
        let iapId = itemConfig.andIapId;
        
        if (sys.isNative && sys.platform === sys.Platform.IOS) {
            iapId = itemConfig.iosIapId;
        }

        const shopId = itemConfig.id;
        const buyCount = MgrShop.Instance.getPackageBuyCount(itemConfig.id);
        const productType = itemConfig.type;
        const payNum = MgrShop.Instance.getPayNum();
        const payMoney = MgrShop.Instance.getPayMoney();

        AnalyticsManager.getInstance().reportShopClick({
            Commodity_ID: iapId,
            Shop_ID: shopId,
            BuyNum: buyCount,
            ProductType: productType,
            PayNum: payNum,
            PayMoney: payMoney
        });
    }
}