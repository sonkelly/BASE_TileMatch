import { _decorator, Component, Node, Button, sp, Label, Tween, tween, v3, easing, CCBoolean } from 'cc';
import { ITEM } from './GameConst';
import { UIPrefabs } from './Prefabs';
import { AssetsCfg } from './AssetsCfg';
import { AsyncQueue } from './AsyncQueue';
import { UIIcon } from './UIIcon';
import { UIPool } from './UIPool';
import { MgrStar, StarEagleRewardState, StarEagleStageLevel } from './MgrStar';
import { MgrUi } from './MgrUi';
import { AppGame } from './AppGame';
import { MgrUser } from './MgrUser';

const { ccclass, property } = _decorator;

@ccclass('StarEagueRewardView')
export class StarEagueRewardView extends Component {
    @property(Button)
    receiveBtn: Button = null!;

    @property(sp.Skeleton)
    rewardSpine: sp.Skeleton = null!;

    @property(Node)
    contentRoot: Node = null!;

    @property(UIPool)
    contentPool: UIPool = null!;

    private _hideCall: Function | null = null;
    private _reward: any[] = null!;
    private _prevLevel: number = 0;
    private _curLevel: number = 0;
    private _openAnimation: string = '';
    private _openIdleAnimation: string = '';
    private _boxState: StarEagleRewardState = StarEagleRewardState.OPEN;
    private _taskAsync: AsyncQueue | null = null;

    onLoad() {
        this.receiveBtn.node.on('click', this._onClickRecieve, this);
        this.rewardSpine.setCompleteListener(() => {
            this._playAnimationComplete();
        });
    }

    reuse(data: any) {
        if (data) {
            this._hideCall = data.hideCall;
            this._reward = data.reward;
            this._prevLevel = data.prevLevel;
            this._curLevel = data.curLevel;
        }
    }

    onEnable() {
        this.receiveBtn.interactable = true;
        this._setAnimationName();
        this._updateItems();
        this._runTask();
    }

    onDisable() {
        if (this._taskAsync) {
            this._taskAsync.clear();
            this._taskAsync = null;
        }
        this.unscheduleAllCallbacks();
        this.rewardSpine.clearAnimations();
    }

    private _playAnimationComplete() {
        if (this._boxState === StarEagleRewardState.OPEN) {
            this.rewardSpine.setAnimation(0, this._openIdleAnimation, true);
        }
    }

    private _setAnimationName() {
        const boxLevel = Math.ceil(this._prevLevel / StarEagleStageLevel);
        this._openAnimation = MgrStar.Instance.getRewardBoxAnimationName(boxLevel, StarEagleRewardState.OPEN);
        this._openIdleAnimation = MgrStar.Instance.getRewardBoxAnimationName(boxLevel, StarEagleRewardState.OPEN_IDLE);
    }

    private _updateItems() {
        this.contentPool.clear();
        
        for (let i = 0; i < this._reward.length; i++) {
            const rewardItem = this._reward[i];
            const itemNode = this.contentPool.get();
            itemNode.parent = this.contentRoot;
            
            const iconComp = itemNode.getComponentInChildren(UIIcon);
            iconComp.icon = AssetsCfg.Instance.get(rewardItem.id).icon;
            rewardItem.target = iconComp;
            
            const labelComp = itemNode.getComponentInChildren(Label);
            if (rewardItem.id === ITEM.Energy) {
                labelComp.string = this.infiniteLifeCount(rewardItem.count);
            } else {
                labelComp.string = 'x' + rewardItem.count;
            }
        }
        
        this.contentRoot.setScale(0, 0, 0);
        this.contentRoot.setPosition(0, 0, 0);
    }

    private infiniteLifeCount(count: number): string {
        const hours = Math.floor(count / 60);
        const minutes = count - 60 * hours;
        return hours ? hours + 'h' + (minutes > 0 ? minutes + 'm' : '') : minutes + 'm';
    }

    private _runTask() {
        this.receiveBtn.node.active = false;
        this._taskAsync = new AsyncQueue();
        
        this._taskAsync.push((next) => {
            this.rewardSpine.setAnimation(0, this._openAnimation, false);
            this.scheduleOnce(next, 0.64);
        });
        
        this._taskAsync.push((next) => {
            Tween.stopAllByTarget(this.contentRoot);
            tween(this.contentRoot)
                .to(0.64, {
                    position: v3(0, 200, 0),
                    scale: v3(1, 1, 1)
                }, {
                    easing: easing.backOut
                })
                .call(() => {
                    next();
                })
                .start();
        });
        
        this._taskAsync.complete = () => {
            this.receiveBtn.node.active = true;
        };
        
        this._taskAsync.play();
    }

    private _onClickRecieve() {
        this.receiveBtn.interactable = false;
        
        const lightRewards: any[] = [];
        const otherRewards: any[] = [];
        
        for (let i = 0; i < this._reward.length; i++) {
            const rewardItem = this._reward[i];
            if (rewardItem.id !== ITEM.Light) {
                otherRewards.push(rewardItem);
            } else {
                lightRewards.push(rewardItem);
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
                const rewardItem = otherRewards[i];
                const userItem = MgrUser.Instance.userData.getItem(rewardItem.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: rewardItem.id,
                    change: rewardItem.count,
                    result: userItem,
                    sourcePos: rewardItem.target.node.getWorldPosition(),
                    priority: 3
                });
            }
            next();
        });
        
        this._taskAsync.push((next) => {
            const processItem = (index: number) => {
                const rewardItem = lightRewards[index];
                const userItem = MgrUser.Instance.userData.getItem(rewardItem.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: rewardItem.id,
                    change: rewardItem.count,
                    result: userItem,
                    sourcePos: rewardItem.target.node.getWorldPosition(),
                    priority: 3,
                    callback: () => {
                        if (index === lightRewards.length - 1) {
                            next();
                        }
                    }
                });
            };
            
            for (let i = 0; i < lightRewards.length; i++) {
                processItem(i);
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
            this._afterFlyReward();
        };
        
        this._taskAsync.play();
    }

    private _createFlyTaskWithoutLight(rewards: any[]) {
        this._taskAsync = new AsyncQueue();
        
        this._taskAsync.push((next) => {
            const processItem = (index: number) => {
                const rewardItem = rewards[index];
                const userItem = MgrUser.Instance.userData.getItem(rewardItem.id);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: rewardItem.id,
                    change: rewardItem.count,
                    result: userItem,
                    sourcePos: rewardItem.target.node.getWorldPosition(),
                    priority: 3,
                    callback: () => {
                        if (index === rewards.length - 1) {
                            next();
                        }
                    }
                });
            };
            
            for (let i = 0; i < rewards.length; i++) {
                processItem(i);
            }
        });
        
        this._taskAsync.complete = () => {
            this._afterFlyReward();
        };
        
        this._taskAsync.play();
    }

    private _afterFlyReward() {
        const prevLevel = this._prevLevel;
        const curLevel = this._curLevel;
        
        MgrUi.Instance.openViewAsync(UIPrefabs.StarEagueStageView, {
            data: {
                prevLevel: prevLevel,
                curLevel: curLevel,
                hideCall: () => {
                    this._hideCall && this._hideCall();
                }
            }
        });
        
        this.node.emit('Close');
    }
}