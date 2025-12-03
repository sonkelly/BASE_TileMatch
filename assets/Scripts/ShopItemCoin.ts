import { _decorator, Component, Node, Sprite, Label, Button, director, Vec3 } from 'cc';
import { ShopCfg } from './ShopCfg';
import { Language } from './Language';
import { MgrUser } from './MgrUser';
import { IShopItemCmp } from './IShopItemCmp';
import { GlobalEvent } from './Events';
import { IAPMgr } from './IAPMgr';
import { Loading } from './Loading';
import { Toast } from './Toast';

const { ccclass, property } = _decorator;

@ccclass('ShopItemCoin')
export class ShopItemCoin extends IShopItemCmp {
    @property(Sprite)
    iconSprite: Sprite | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Label)
    descLabel: Label | null = null;

    @property(Label)
    costLabel: Label | null = null;

    @property(Button)
    buyBtn: Button | null = null;

    @property(Button)
    contentBtn: Button | null = null;

    @property(Node)
    deleteNode: Node | null = null;

    @property(Label)
    deleteNodeLabel: Label | null = null;

    public _cfg: any = null;
    private _rewardId: number | null = null;
    private _rewardCnt: number | null = null;

    onLoad() {
        this.buyBtn?.node.on(Button.EventType.CLICK, this._onClickBuy, this);
        this.contentBtn?.node.on(Button.EventType.CLICK, this._onClickBuy, this);
    }

    onEnable() {
        director.on(GlobalEvent.shopBuyPackage, this._shopBuyPackage, this);
        director.on(GlobalEvent.shopRefreshProductDetails, this._refreshCost, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    refreshInfo(cfg: any) {
        this._cfg = cfg;
        const rewardParts = this._cfg.reward.split('|');
        this._rewardId = Number(rewardParts[0]);
        this._rewardCnt = Number(rewardParts[1]);
        
        this._refreshDesc();
        this._refreshPackageIcon();
        this._refreshCost();
        this._refreshOff();
        this._refreshReward();
    }

    private _refreshDesc() {
        if (this.descLabel) {
            this.descLabel.string = Language.Instance.getLangByID(this._cfg.desc);
        }
    }

    private async _refreshPackageIcon() {
        if (this.iconSprite) {
            this.iconSprite.spriteFrame = await ShopCfg.Instance.loadPackageIcon(this._cfg.id);
        }
    }

    private _refreshCost() {
        if (this.costLabel) {
            this.costLabel.string = IAPMgr.Instance.getProductPrice(this._cfg);
        }
    }

    private _refreshOff() {
        const hasDiscount = this._cfg.off !== 1;
        if (this.deleteNode) {
            this.deleteNode.active = hasDiscount;
        }
        
        const position = hasDiscount ? new Vec3(0, 18, 0) : new Vec3(0, 0, 0);
        this.costLabel?.node.setPosition(position);
        
        if (this.deleteNodeLabel) {
            this.deleteNodeLabel.string = IAPMgr.Instance.getdeletePrice(this._cfg);
        }
    }

    private _refreshReward() {
        const rewardParts = this._cfg.reward.split('|');
        const rewardCount = rewardParts[1];
        if (this.countLabel) {
            this.countLabel.string = 'x' + rewardCount;
        }
    }

    private _onClickBuy() {
        if (IAPMgr.Instance.isIAPStoreEnabled()) {
            this.reportShopItemClick(this._cfg);
            Loading.open('');
            IAPMgr.Instance.purchaseProduct(this._cfg);
        } else {
            Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
        }
    }

    private _shopBuyPackage(packageId: string) {
        if (this._cfg.id === packageId) {
            this._givenReward();
        }
    }

    private _givenReward() {
        const currentItem = MgrUser.Instance.userData.getItem(this._rewardId!);
        MgrUser.Instance.userData.flyAddItem({
            itemId: this._rewardId!,
            change: this._rewardCnt!,
            result: currentItem,
            sourcePos: this.iconSprite?.node.getWorldPosition()!,
            callback: () => {
                this._afterGiveReward();
            }
        });
    }

    private _afterGiveReward() {
        this.delegate.onShopItemGiveAfter(this);
    }
}