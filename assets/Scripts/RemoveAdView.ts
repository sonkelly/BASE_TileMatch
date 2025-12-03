import { _decorator, Node, Label, Button, Sprite, director, Tween, tween, sys, v3, cclegacy } from 'cc';
import { ShopCfg } from './ShopCfg';
import { AsyncQueue } from './AsyncQueue';
import { GlobalEvent } from './Events';
import { IAPMgr } from './IAPMgr';
import { Language } from './Language';
import { Toast } from './Toast';
import { Loading } from './Loading';
import { MgrShop } from './MgrShop';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrUser } from './MgrUser';
import { AppGame } from './AppGame';
import { GameConst, ITEM } from './GameConst';
import { AssetsCfg } from './AssetsCfg';
import { ViewAnimCtrl, VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { UIPool } from './UIPool';

const { ccclass, property } = _decorator;

@ccclass('RemoveAdView')
export class RemoveAdView extends UIPool {
    @property(Node)
    lightNode: Node = null!;

    @property(Label)
    costLabel: Label = null!;

    @property(Node)
    deleteNode: Node = null!;

    @property(Label)
    deleteNodeLabel: Label = null!;

    @property(Button)
    buyBtn: Button = null!;

    @property(Button)
    contentBtn: Button = null!;

    @property(Button)
    closeBtn: Button = null!;

    @property(Node)
    itemCoin: Node = null!;

    @property(Node)
    itemProps: Node = null!;

    @property(Node)
    barganNotice: Node = null!;

    @property(Label)
    barganLabel: Label = null!;

    @property(Sprite)
    iconSprite: Sprite = null!;

    private _cfg: any = null;
    private _rewardsArray: any[] = [];
    private _propItems: Node[] = [];
    private _taskAsync: AsyncQueue | null = null;

    onLoad() {
        this._cfg = ShopCfg.Instance.get(GameConst.REMOVE_ADS_DASK);
        this.buyBtn.node.on('click', this._onClickBuy, this);
        this.contentBtn.node.on('click', this._onClickBuy, this);
        this.closeBtn.node.on('click', this._onClickClose, this);
    }

    onEnable() {
        director.on(GlobalEvent.shopBuyPackage, this._shopBuyPackage, this);
        director.on(GlobalEvent.shopRefreshProductDetails, this._refreshCost, this);
        director.on(GlobalEvent.inAppPurchaseFail, this._resetBuyBtnEnabled, this);
        this._resetBuyBtnEnabled();
        this._refreshInfo();
    }

    onDisable() {
        director.targetOff(this);
        Tween.stopAllByTarget(this.lightNode);
        this.clear();
        this._propItems.length = 0;
        this._taskAsync?.clear();
        this._taskAsync = null;
        this.unscheduleAllCallbacks();
    }

    private _refreshInfo() {
        this._actLight();
        this._refreshCost();
        this._refreshOff();
        this._refreshPackageIcon();
        this._refreshPackageReward();
    }

    private _actLight() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _refreshCost() {
        this.costLabel.string = IAPMgr.Instance.getProductPrice(this._cfg);
    }

    private _refreshOff() {
        const hasOff = this._cfg.off != 1;
        this.deleteNode.active = hasOff;
        this.barganNotice.active = hasOff;

        const position = hasOff ? v3(0, 18, 0) : v3(0, 0, 0);
        this.costLabel.node.setPosition(position);
        this.deleteNodeLabel.string = IAPMgr.Instance.getdeletePrice(this._cfg);

        const discountPercent = ((1 / this._cfg.off) * 100).toFixed(0) + '%';
        this.barganLabel.string = Language.Instance.getLangByID('great_value').replace('%value', discountPercent);
    }

    private async _refreshPackageIcon() {
        this.iconSprite.spriteFrame = await ShopCfg.Instance.loadPackageIcon(this._cfg.id);
    }

    private _refreshPackageReward() {
        const rewards = this._cfg.reward.split(',');
        this._rewardsArray.length = 0;

        for (let i = 0; i < rewards.length; i++) {
            const reward = rewards[i].split('|');
            const id = reward[0];
            const count = reward[1];
            this._rewardsArray.push({
                id: Number(id),
                count: Number(count)
            });
        }

        let hasCoin = false;
        let hasProps = false;

        for (let i = 0; i < this._rewardsArray.length; i++) {
            const reward = this._rewardsArray[i];
            if (reward.id == ITEM.Coin) {
                hasCoin = true;
                this.itemCoin.getComponentInChildren(Label)!.string = 'x' + reward.count;
                reward.target = this.itemCoin.getComponentInChildren(Sprite);
            } else {
                hasProps = true;
                const itemNode = this.get()!;
                itemNode.parent = this.itemProps;
                itemNode.getComponentInChildren(Sprite)!.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(reward.id);
                itemNode.getComponentInChildren(Label)!.string = 'x' + reward.count;
                reward.target = itemNode.getComponentInChildren(Sprite);
                itemNode.active = true;
                this._propItems.push(itemNode);
            }
        }

        this.itemCoin.active = hasCoin;
        this.itemProps.active = hasProps;
    }

    private _onClickClose() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private _resetBuyBtnEnabled() {
        this.buyBtn.interactable = true;
        this.contentBtn.interactable = true;
    }

    private _onClickBuy() {
        if (IAPMgr.Instance.isIAPStoreEnabled()) {
            this.buyBtn.interactable = false;
            this.contentBtn.interactable = false;
            this.reportShopItemClick(this._cfg);
            Loading.open('');
            IAPMgr.Instance.purchaseProduct(this._cfg);
        } else {
            Toast.tip(Language.Instance.getLangByID('shop_buy_fail'));
        }
    }

    private reportShopItemClick(cfg: any) {
        let iapId = cfg.andIapId;
        if (sys.isNative && sys.platform == sys.Platform.IOS) {
            iapId = cfg.iosIapId;
        }

        const shopId = cfg.id;
        const buyCount = MgrShop.Instance.getPackageBuyCount(cfg.id);
        const productType = cfg.type;
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

    private _shopBuyPackage(packageId: string) {
        if (this._cfg.id == packageId) {
            this._givenReward();
        }
    }

    private _givenReward() {
        const lightRewards: any[] = [];
        const otherRewards: any[] = [];

        for (let i = 0; i < this._rewardsArray.length; i++) {
            const reward = this._rewardsArray[i];
            if (reward.id != ITEM.Light) {
                otherRewards.push(reward);
            } else {
                lightRewards.push(reward);
            }
        }

        if (lightRewards.length > 0) {
            this._createFlyTaskWithLight(lightRewards, otherRewards);
        } else {
            this._createFlyTaskWithoutLight(otherRewards);
        }
    }

    private _createFlyTaskWithLight(lightRewards: any[], otherRewards: any[]) {
        this._taskAsync = new AsyncQueue();
        this._taskAsync.push((next) => {
            AppGame.topUI.lightningItem.show(0.2, next);
        });

        this._taskAsync.push((next) => {
            for (let i = 0; i < otherRewards.length; i++) {
                const reward = otherRewards[i];
                const result = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: result,
                    sourcePos: reward.target.node.getWorldPosition()
                });
            }
            next();
        });

        this._taskAsync.push((next) => {
            const processReward = (index: number) => {
                const reward = lightRewards[index];
                const result = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: result,
                    sourcePos: reward.target.node.getWorldPosition(),
                    callback: () => {
                        if (index == lightRewards.length - 1) {
                            next();
                        }
                    }
                });
            };

            for (let i = 0; i < lightRewards.length; i++) {
                processReward(i);
            }
        });

        this._taskAsync.push((next) => {
            this.scheduleOnce(next, 0.4);
        });

        this._taskAsync.push((next) => {
            AppGame.topUI.lightningItem.hide();
            next();
        });

        this._taskAsync.complete = () => {
            this._afterGiveReward();
        };

        this._taskAsync.play();
    }

    private _createFlyTaskWithoutLight(rewards: any[]) {
        this._taskAsync = new AsyncQueue();
        this._taskAsync.push((next) => {
            const processReward = (index: number) => {
                const reward = rewards[index];
                const result = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: result,
                    sourcePos: reward.target.node.getWorldPosition(),
                    callback: () => {
                        if (index == rewards.length - 1) {
                            next();
                        }
                    }
                });
            };

            for (let i = 0; i < rewards.length; i++) {
                processReward(i);
            }
        });

        this._taskAsync.complete = () => {
            this._afterGiveReward();
        };

        this._taskAsync.play();
    }

    private _afterGiveReward() {
        if (MgrShop.Instance.checkLimitBuyCntMax(this._cfg.id) || 
            MgrShop.Instance.checkLimitCycleBuyCntMax(this._cfg.id)) {
            this.node.emit(VIEW_ANIM_EVENT.Close);
        }
    }
}