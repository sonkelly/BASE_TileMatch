import { _decorator, Component, Node, Label, Sprite, Button, director, Tween, tween, macro, v3, Vec3 } from 'cc';
import { ShopCfg } from './ShopCfg';
import { Language } from './Language';
import { GlobalEvent } from './Events';
import { MgrShop } from './MgrShop';
import { Utils } from './Utils';
import { GameConst, ITEM } from './GameConst';
import { AssetsCfg } from './AssetsCfg';
import { IShopItemCmp } from './IShopItemCmp';
import { MgrUser } from './MgrUser';
import { AsyncQueue } from './AsyncQueue';
import { AppGame } from './AppGame';
import { Tools } from './Tools';
import { IAPMgr } from './IAPMgr';
import { Loading } from './Loading';
import { Toast } from './Toast';
import { UIPool } from './UIPool';

const { ccclass, property } = _decorator;

@ccclass('ShopItemLimited')
export class ShopItemLimited extends IShopItemCmp {
    @property(Label)
    nameLabel: Label = null!;

    @property(Node)
    lightNode: Node = null!;

    @property(Sprite)
    iconSprite: Sprite = null!;

    @property(Label)
    timeLabel: Label = null!;

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

        this.schedule(this._refreshRemainTime, 1, macro.REPEAT_FOREVER, Math.random());
        this._refreshName();
        this._actLight();
        this._refreshRemainTime();
        this._refreshPackageIcon();
        this._refreshCost();
        this._refreshOff();
        this._refreshReward();
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

    public _refreshRemainTime() {
        const remainTime = MgrShop.Instance.getPackageCloseTime(this._cfg.id) - Tools.GetNowTime();
        if (remainTime <= 0) {
            this.timeLabel.string = '';
        } else {
            const timeStr = Language.Instance.getLangByID('Pass_Time');
            const timeConvert = Utils.timeConvertToDDHHOrHHMM(remainTime);
            this.timeLabel.string = timeStr + timeConvert;
        }
    }

    private async _refreshPackageIcon() {
        this.iconSprite.spriteFrame = await ShopCfg.Instance.loadPackageIcon(this._cfg.id);
    }

    private _refreshCost() {
        this.costLabel.string = IAPMgr.Instance.getProductPrice(this._cfg);
    }

    private _refreshOff() {
        const hasOff = this._cfg.off != 1;
        this.deleteNode.active = hasOff;
        
        const pos = hasOff ? v3(0, 18, 0) : v3(0, 0, 0);
        this.costLabel.node.setPosition(pos);
        
        this.deleteNodeLabel.string = IAPMgr.Instance.getdeletePrice(this._cfg);
    }

    private _refreshReward() {
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
                const propItem = this.itemPropsPool.get() as Node;
                propItem.parent = this.itemPropsPool.node;
                propItem.getComponentInChildren(Sprite)!.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(reward.id);
                propItem.getComponentInChildren(Label)!.string = 'x' + reward.count;
                reward.target = propItem.getComponentInChildren(Sprite);
                propItem.active = true;
                this._propItems.push(propItem);
            }
        }
        
        const isSingleReward = this._rewardsArray.length <= 1;
        this.itemCoin.setScale(v3(1, 1, 1));
        this.itemProps.setScale(v3(1, 1, 1));
        
        if (isSingleReward && hasCoin) {
            this.itemCoin.setScale(v3(1.5, 1.25, 1));
        }
        if (isSingleReward && hasProps) {
            this.itemProps.setScale(v3(1.5, 1.5, 1));
        }
        
        this.itemCoin.active = hasCoin;
        this.itemProps.active = hasProps;
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

    private _shopBuyPackage(packageId: number) {
        if (this._cfg.id == packageId) {
            this._givenReward();
        }
    }

    private _givenReward() {
        const lightRewards: any[] = [];
        const normalRewards: any[] = [];
        
        for (let i = 0; i < this._rewardsArray.length; i++) {
            const reward = this._rewardsArray[i];
            if (reward.id != ITEM.Light) {
                normalRewards.push(reward);
            } else {
                lightRewards.push(reward);
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
            for (let i = 0; i < normalRewards.length; i++) {
                const reward = normalRewards[i];
                const userItem = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: userItem,
                    sourcePos: reward.target.node.getWorldPosition()
                });
            }
            next();
        });
        
        this._taskAsync.push((next) => {
            const processReward = (index: number) => {
                const reward = lightRewards[index];
                const userItem = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: userItem,
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
                const userItem = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: userItem,
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
}