import { _decorator, Component, Button, Label, Sprite, Node, director, sys } from 'cc';
import {ViewAnimCtrl} from './ViewAnimCtrl';
import {MgrPig} from './MgrPig';
import {MgrUser} from './MgrUser';
import { GlobalEvent } from './Events';
import {IAPMgr} from './IAPMgr';
import {MgrShop} from './MgrShop';
import { ShopCurrency } from './Const';
import {AnalyticsManager} from './AnalyticsManager';
import { ITEM } from './GameConst';
const { ccclass, property } = _decorator;

@ccclass('PigBankView')
export default class PigBankView extends Component {
    @property(Button)
    public closeBtn: Button | null = null;

    @property(Button)
    public buyBtn: Button | null = null;

    @property(Label)
    public costLabel: Label | null = null;

    @property(Label)
    public coinLabel: Label | null = null;

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Node)
    public tipFull: Node | null = null;

    @property(Node)
    public tipNoFull: Node | null = null;

    private _cfg: any = null;

    onLoad() {
        this.closeBtn?.node.on('click', this.onClose, this);
        this.buyBtn?.node.on('click', this.onBuy, this);
        this._cfg = MgrShop.Instance.getGoldPigCfg();
    }

    onEnable() {
        director.on(GlobalEvent.shopBuyPackage, this._shopBuyPackage, this);
        director.on(GlobalEvent.shopRefreshProductDetails, this._refreshCost, this);
        IAPMgr.Instance.checkProductDetails();
        this._refreshCoin();
        this._refreshCost();
        this._refreshTip();
    }

    onDisable() {
        director.targetOff(this);
    }

    private _refreshCoin() {
        if (this.coinLabel) {
            this.coinLabel.string = 'x' + MgrPig.Instance.data.pigCoin;
        }
    }

    private _refreshCost() {
        if (this.costLabel) {
            this.costLabel.string = IAPMgr.Instance.getProductPrice(this._cfg);
        }
    }

    private _refreshTip() {
        const isMax = MgrPig.Instance.checkPigCoinIsMax();
        if (this.tipFull) this.tipFull.active = isMax;
        if (this.tipNoFull) this.tipNoFull.active = !isMax;
    }

    public onBuy() {
        this.reportShopItemClick(this._cfg);
        if (this._cfg && this._cfg.currency === ShopCurrency.Cash) {
            IAPMgr.Instance.purchaseProduct(this._cfg);
        }
    }

    public onClose() {
        const anim = this.node.getComponent(ViewAnimCtrl);
        anim?.onClose();
    }

    private reportShopItemClick(cfg: any) {
        if (!cfg) return;
        let commodityId = cfg.andIapId;
        if (sys.isNative && sys.platform === sys.Platform.IOS) {
            commodityId = cfg.iosIapId;
        }
        const shopId = cfg.id;
        const buyNum = MgrShop.Instance.getPackageBuyCount(cfg.id);
        const productType = cfg.type;
        const payNum = MgrShop.Instance.getPayNum();
        const payMoney = MgrShop.Instance.getPayMoney();
        AnalyticsManager.getInstance().reportShopClick({
            Commodity_ID: commodityId,
            Shop_ID: shopId,
            BuyNum: buyNum,
            ProductType: productType,
            PayNum: payNum,
            PayMoney: payMoney
        });
    }

    private _shopBuyPackage(id: any) {
        if (MgrShop.Instance.getGoldPigCfg().id === id) {
            this._givenReward();
        }
    }

    private _givenReward() {
        const itemId = ITEM.Coin;
        const change = MgrPig.Instance.data.pigCoin;
        const result = MgrUser.Instance.userData.getItem(itemId);
        MgrUser.Instance.userData.flyAddItem({
            itemId,
            change,
            result,
            sourcePos: this.iconSprite?.node.getWorldPosition(),
            callback: () => {
                this.onClose();
            }
        });
    }
}