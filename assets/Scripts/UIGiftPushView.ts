import { _decorator, Component, Node } from 'cc';
import {GiftPushCfg} from './GiftPushCfg';
import {ShopCfg} from './ShopCfg';
import { MgrShop } from './MgrShop';
import { IShopItemCmp } from './IShopItemCmp';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';

const { ccclass, property } = _decorator;

@ccclass('UIGiftPushView')
export class UIGiftPushView extends Component {
    @property(IShopItemCmp)
    shopItem: IShopItemCmp | null = null;

    giftId: number = 0;

    reuse(giftData: { giftId: number }) {
        this.giftId = giftData.giftId;
    }

    onEnable() {
        const shopId = GiftPushCfg.Instance.get(this.giftId).shopId;
        const shopInfo = ShopCfg.Instance.get(shopId);
        this.shopItem?.refreshInfo(shopInfo);
        this.shopItem!.delegate = this;
    }

    onShopItemGiveAfter(shopItem: IShopItemCmp) {
        const shopId = shopItem.getShopId();
        if (MgrShop.Instance.checkLimitBuyCntMax(shopId) || MgrShop.Instance.checkLimitCycleBuyCntMax(shopId)) {
            this.close();
        }
    }

    close() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
    }
}