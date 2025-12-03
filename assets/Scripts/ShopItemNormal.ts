import { _decorator, Component, Label, Node, Sprite, Button, director, Tween, tween, v3, Vec3 } from 'cc';
import { GameConst, ITEM } from './GameConst';
import {AssetsCfg} from './AssetsCfg';
import {Language} from './Language';
import { IShopItemCmp } from './IShopItemCmp';
import { MgrUser } from './MgrUser';
import { AsyncQueue } from './AsyncQueue';
import { AppGame } from './AppGame';
import { GoldPigShopId } from './MgrShop';
import { GlobalEvent } from './Events';
import { IAPMgr } from './IAPMgr';
import { MgrPig } from './MgrPig';
import {Loading} from './Loading';
import {Toast} from './Toast';
import { UIPool } from './UIPool';
import { ShopCfg } from './ShopCfg';

const { ccclass, property } = _decorator;

@ccclass('ShopItemNormal')
export class ShopItemNormal extends IShopItemCmp {
    @property(Label)
    nameLabel: Label = null!;

    @property(Node)
    lightNode: Node = null!;

    @property(Sprite)
    iconSprite: Sprite = null!;

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

    @property(Node)
    itemCoin: Node = null!;

    @property(Node)
    itemProps: Node = null!;

    @property(UIPool)
    itemPropsPool: UIPool = null!;

    @property(Node)
    tipAd: Node = null!;

    public _cfg: any = null;
    private _rewardsArray: any[] = [];
    private _propItems: Node[] = [];
    private _taskAsync: AsyncQueue = null!;

    onLoad() {
        this.buyBtn.node.on('click', this._onClickBuy, this);
        this.contentBtn.node.on('click', this._onClickBuy, this);
    }

    onEnable() {
        director.on(GlobalEvent.shopBuyPackage, this._shopBuyPackage, this);
        director.on(GlobalEvent.shopRefreshProductDetails, this._refreshCost, this);
        director.on(GlobalEvent.goldPigRefreshCoin, this._onlyRefreshPigBankReward, this);
        if(this.tipAd)this.tipAd.active = false;
    }

    onDisable() {
        director.targetOff(this);
        Tween.stopAllByTarget(this.lightNode);
        
        this._propItems.forEach(item => {
            this.itemPropsPool.put(item);
        });
        this._propItems.length = 0;
        
        if (this._taskAsync) {
            this._taskAsync.clear();
        }
        this._taskAsync = null;
        this.unscheduleAllCallbacks();
    }

    refreshInfo(cfg: any) {
        this._cfg = cfg;
        this._refreshName();
        this._actLight();
        this._refreshPackageIcon();
        this._refreshCost();
        this._refreshOff();
        this._refreshReward();
        if(this.tipAd) this.tipAd.active = GameConst.REMOVE_ADS_PACKIDS.includes(cfg.id);
    }

    private _refreshName() {
        this.nameLabel.string = Language.Instance.getLangByID(this._cfg.name);
    }

    private _actLight() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private async _refreshPackageIcon() {
        this.iconSprite.spriteFrame = await ShopCfg.Instance.loadPackageIcon(this._cfg.id);
    }

    private _refreshCost() {
        this.costLabel.string = IAPMgr.Instance.getProductPrice(this._cfg);
    }

    private _refreshOff() {
        const hasOff = this._cfg.off !== 1;
        this.deleteNode.active = hasOff;
        
        const pos = hasOff ? v3(0, 18, 0) : v3(0, 0, 0);
        this.costLabel.node.setPosition(pos);
        
        this.deleteNodeLabel.string = IAPMgr.Instance.getdeletePrice(this._cfg);
    }

    private _refreshReward() {
        if (this._cfg.id === GoldPigShopId) {
            this._refreshPigBankReward();
        } else {
            this._refreshPackageReward();
        }
    }

    private _onlyRefreshPigBankReward() {
        if (this._cfg.id === GoldPigShopId) {
            this._refreshPigBankReward();
        }
    }

    private _refreshPackageReward() {
        const rewards = this._cfg.reward.split(',');
        this._rewardsArray.length = 0;

        for (const reward of rewards) {
            const [id, count] = reward.split('|');
            this._rewardsArray.push({
                id: Number(id),
                count: Number(count)
            });
        }

        let hasCoin = false;
        let hasProps = false;

        for (const reward of this._rewardsArray) {
            if (reward.id === ITEM.Coin) {
                hasCoin = true;
                this.itemCoin.getComponentInChildren(Label)!.string = 'x' + reward.count;
                reward.target = this.itemCoin.getComponentInChildren(Sprite);
            } else {
                hasProps = true;
                const propItem = this.itemPropsPool.get() as Node;
                propItem.parent = this.itemPropsPool.node;
                propItem.getComponentInChildren(Sprite)!.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(reward.id);
                propItem.getComponentInChildren(Label)!.string = 'x' + reward.count;
                reward.target = propItem.getComponentInChildren(Sprite);
                propItem.active = true;
                this._propItems.push(propItem);
            }
        }

        const singleReward = this._rewardsArray.length <= 1;
        this.itemCoin.setScale(v3(1, 1, 1));
        this.itemProps.setScale(v3(1, 1, 1));

        if (singleReward && hasCoin) {
            this.itemCoin.setScale(v3(1.5, 1.25, 1));
        }
        if (singleReward && hasProps) {
            this.itemProps.setScale(v3(1.5, 1.5, 1));
        }

        this.itemCoin.active = hasCoin;
        this.itemProps.active = hasProps;
    }

    private _refreshPigBankReward() {
        this._rewardsArray.length = 0;
        
        const reward = {
            id: ITEM.Coin,
            count: MgrPig.Instance.data.pigCoin
        };
        
        this._rewardsArray.push(reward);
        this.itemCoin.active = true;
        this.itemProps.active = false;
        this.itemCoin.setScale(v3(1.25, 1.25, 1));
        this.itemCoin.getComponentInChildren(Label)!.string = 'x' + reward.count;
        reward.target = this.itemCoin.getComponentInChildren(Sprite);
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
        const lightRewards: any[] = [];
        const normalRewards: any[] = [];

        for (const reward of this._rewardsArray) {
            if (reward.id === ITEM.Light) {
                lightRewards.push(reward);
            } else {
                normalRewards.push(reward);
            }
        }

        if (lightRewards.length > 0) {
            this._createFlyTaskWithLight(lightRewards, normalRewards);
        } else {
            this._createFlyTaskWithoutLight(normalRewards);
        }
    }

    private _createFlyTaskWithLight(lightRewards: any[], normalRewards: any[]) {
        this._taskAsync = new AsyncQueue();
        
        this._taskAsync.push((next) => {
            AppGame.topUI.lightningItem.show(0.2, next);
        });

        this._taskAsync.push((next) => {
            for (const reward of normalRewards) {
                const current = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: current,
                    sourcePos: reward.target.node.getWorldPosition()
                });
            }
            next();
        });

        this._taskAsync.push((next) => {
            const processReward = (index: number) => {
                const reward = lightRewards[index];
                const current = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: current,
                    sourcePos: reward.target.node.getWorldPosition(),
                    callback: () => {
                        if (index === lightRewards.length - 1) {
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
                const current = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: current,
                    sourcePos: reward.target.node.getWorldPosition(),
                    callback: () => {
                        if (index === rewards.length - 1) {
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
        this.delegate.onShopItemGiveAfter(this);
    }

    // IShopItemCmp implementation
    delegate: any = null!;
    reportShopItemClick(cfg: any): void {}
}