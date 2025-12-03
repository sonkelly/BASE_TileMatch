import { _decorator, Component, Button, Layout, Sprite, Label, UITransform, Size, size, Node } from 'cc';
import { UIPool } from './UIPool';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrRace } from './MgrRace';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';
import { RaceRewardCfg } from './RaceRewardCfg';
import { AsyncQueue } from './AsyncQueue';
import { AssetsCfg } from './AssetsCfg';
import { AppGame } from './AppGame';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('RaceSuccess')
export class RaceSuccess extends UIPool {
    @property(Button)
    continueBtn: Button = null!;

    @property(Layout)
    listLayout: Layout = null!;

    private _rank: number = -1;
    private _rewardCfg: any = null;
    private _rewardsArray: any[] = [];
    private _taskAsync: AsyncQueue = null!;

    reuse(data: any) {
        this._rank = data.rank;
    }

    onLoad() {
        this.continueBtn.node.on('click', this._onClickContinue, this);
    }

    onEnable() {
        this.continueBtn.interactable = true;
        this._refreshReward();
    }

    onDisable() {
        this.clear();
        if (this._taskAsync) {
            this._taskAsync.clear();
            this._taskAsync = null!;
        }
        this.unscheduleAllCallbacks();
    }

    private _refreshReward() {
        this._rewardCfg = RaceRewardCfg.Instance.get(this._rank);
        const rewards = this._rewardCfg.reward.split(',');
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

        for (let i = 0; i < this._rewardsArray.length; i++) {
            const reward = this._rewardsArray[i];
            const itemNode = this.get();
            itemNode.parent = this.listLayout.node;

            const sprite = itemNode.getComponentInChildren(Sprite);
            const label = itemNode.getComponentInChildren(Label);

            if (sprite) {
                sprite.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(reward.id);
            }
            if (label) {
                label.string = 'x' + reward.count;
            }

            reward.target = sprite;

            switch (reward.id) {
                case ITEM.Coin:
                    if (sprite) {
                        sprite.node.getComponent(UITransform)!.contentSize = size(64, 64);
                    }
                    break;
                default:
                    // Default case
                    break;
            }
        }

        if (this._rewardsArray.length >= 5) {
            this.listLayout.node.getComponent(UITransform)!.contentSize = size(450, 320);
        } else if (this._rewardsArray.length >= 3) {
            this.listLayout.node.getComponent(UITransform)!.contentSize = size(450, 220);
        } else {
            this.listLayout.node.getComponent(UITransform)!.contentSize = size(450, 100);
        }
    }

    private _onClickContinue() {
        this.continueBtn.interactable = false;
        MgrRace.Instance.settlementOneTurn();
        this._givenReward();
    }

    private _givenReward() {
        const lightRewards: any[] = [];
        const otherRewards: any[] = [];

        for (let i = 0; i < this._rewardsArray.length; i++) {
            const reward = this._rewardsArray[i];
            if (reward.id !== ITEM.Light) {
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
                const userItem = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: userItem,
                    sourcePos: reward.target.node.getWorldPosition(),
                    priority: 3
                });
            }
            next();
        });

        this._taskAsync.push((next) => {
            for (let i = 0; i < lightRewards.length; i++) {
                const reward = lightRewards[i];
                const userItem = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: userItem,
                    sourcePos: reward.target.node.getWorldPosition(),
                    priority: 3,
                    callback: () => {
                        if (i === lightRewards.length - 1) {
                            next();
                        }
                    }
                });
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
            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];
                const userItem = MgrUser.Instance.userData.getItem(reward.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: reward.id,
                    change: reward.count,
                    result: userItem,
                    sourcePos: reward.target.node.getWorldPosition(),
                    priority: 3,
                    callback: () => {
                        if (i === rewards.length - 1) {
                            next();
                        }
                    }
                });
            }
        });

        this._taskAsync.complete = () => {
            this._afterGiveReward();
        };

        this._taskAsync.play();
    }

    private _afterGiveReward() {
        MgrUi.Instance.closeView(UIPrefabs.RaceView.url);
        this.node.getComponent(ViewAnimCtrl)!.onClose();
        MgrRace.Instance.checkAutoPopMatchView();
    }
}