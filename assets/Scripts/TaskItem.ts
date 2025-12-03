import { _decorator, Component, Node, Sprite, SpriteFrame, Label, ProgressBar, Button, Tween, Vec3, tween, easing, director } from 'cc';
import { UIIcon } from './UIIcon';
import { TaskCfg } from './TaskCfg';
import { MgrTask } from './MgrTask';
import { TASK_STATUS, TASK_TYPE, TaskIconPath } from './Const';
import { AssetsCfg } from './AssetsCfg';
import { Language } from './Language';
import { AssetMgr } from './AssetMgr';
import {BUNDLE_NAMES} from './AssetRes';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';
import { LevelCfg } from './LevelCfg';
import { AnalyticsManager } from './AnalyticsManager';
import { ITEM } from './GameConst';
import { AsyncQueue } from './AsyncQueue';
import { AppGame } from './AppGame';

const { ccclass, property } = _decorator;

@ccclass('TaskItem')
export class TaskItem extends Component {
    @property(Sprite)
    itemBg: Sprite = null!;

    @property(SpriteFrame)
    itemBgSfComplete: SpriteFrame = null!;

    @property(Node)
    earnTag: Node = null!;

    @property(Sprite)
    icon: Sprite = null!;

    @property(Label)
    title: Label = null!;

    @property(ProgressBar)
    progress: ProgressBar = null!;

    @property(Label)
    progressLabel: Label = null!;

    @property(Label)
    rewardTip: Label = null!;

    @property(UIIcon)
    rewardIcon: UIIcon = null!;

    @property(Label)
    rewardLabel: Label = null!;

    @property(Button)
    earnBtn: Button = null!;

    private _taskId: number = null!;
    private taskCfg: any = null;
    private taskData: any = null;
    private delegate: any = null;
    private itemBgSfOrigin: SpriteFrame = null!;
    private _taskAsync: AsyncQueue = null!;
    private _taskStart: boolean = false;
    private _taskFinish: boolean = false;

    get taskId(): number {
        return this._taskId;
    }

    set taskId(value: number) {
        if (value !== this._taskId) {
            this.playEnter();
        }
        this._taskId = value;
        if (this._taskId) {
            this.showItem();
        }
    }

    onLoad() {
        this.earnBtn.node.on('click', this.onEarnClick, this);
        this.itemBgSfOrigin = this.itemBg.spriteFrame!;
    }

    showItem() {
        this.hideEarnAnim();
        this.taskCfg = TaskCfg.Instance.get(this._taskId);
        if (this.taskCfg.time === 0) {
            this.taskData = MgrTask.Instance.data.getYearTaskById(this._taskId);
        } else if (this.taskCfg.time === 1) {
            this.taskData = MgrTask.Instance.data.getWeekTaskById(this._taskId);
        }
        this.showIcon();
        this.showTitle();
        this.showReward();
        this.showStatus();
    }

    async showIcon() {
        this.icon.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, TaskIconPath + this.taskCfg.taskType);
    }

    showReward() {
        this.rewardTip.node.active = false;
        this.earnBtn.node.active = false;
        this.earnTag.active = false;

        if (this.taskData.status === TASK_STATUS.Job) {
            this.rewardTip.node.active = true;
        } else if (this.taskData.status === TASK_STATUS.Complete) {
            this.earnBtn.node.active = true;
            this.earnTag.active = true;
        }

        this.itemBg.spriteFrame = this.taskData.status === TASK_STATUS.Complete ? this.itemBgSfComplete : this.itemBgSfOrigin;

        const rewards = this.taskCfg.rewards.split('|');
        this.rewardIcon.icon = AssetsCfg.Instance.get(Number(rewards[0])).icon;
        this.rewardLabel.string = 'x' + rewards[1];
    }

    showTitle() {
        let titleText = '';
        if (this.taskCfg.taskType === TASK_TYPE.GROUP_LEVEL) {
            const baseTitle = Language.Instance.getLangByID('title_task_' + this.taskCfg.taskType);
            const levelName = LevelCfg.Instance.get(this.taskCfg.proress).name;
            const translatedName = Language.Instance.getLangByID(levelName);
            titleText = baseTitle.replace('%value', translatedName);
        } else {
            titleText = Language.Instance.getLangByID('title_task_' + this.taskCfg.taskType).replace('%value', '' + this.taskCfg.proress);
        }
        this.title.string = titleText;
    }

    showStatus() {
        this.progress.node.parent.active = false;
        this.rewardTip.node.active = false;
        this.earnBtn.node.active = false;

        if (this.taskData.status === TASK_STATUS.Complete) {
            this.earnBtn.node.active = true;
            this.showEarnAnim();
        } else if (this.taskData.status === TASK_STATUS.Job) {
            this.rewardTip.node.active = true;
            this.progress.node.parent.active = true;
            this.progress.progress = this.taskData.cur / this.taskData.max;
            this.progressLabel.string = this.taskData.cur + '/' + this.taskData.max;
        }
    }

    onEnable() {
        this._taskStart = false;
        this._taskFinish = false;
    }

    onDisable() {
        this.hideEarnAnim();
        this.unscheduleAllCallbacks();
        
        if (this._taskAsync) {
            this._taskAsync.clear();
            this._taskAsync = null!;
        }

        if (this._taskStart && !this._taskFinish) {
            AppGame.topUI.lightningItem.hide();
        }
    }

    playEnter() {
        Tween.stopAllByTarget(this.node);
        this.node.scale = Vec3.ZERO;
        tween(this.node)
            .to(0.5, { scale: Vec3.ONE }, { easing: easing.backOut })
            .start();
    }

    onEarnClick() {
        if (this.taskData.status === TASK_STATUS.Complete) {
            MgrTask.Instance.data.earnTask(this.taskCfg.id);
            const rewards = this.taskCfg.rewards.split('|');
            const itemId = Number(rewards[0]);
            const amount = Number(rewards[1]);

            MgrUser.Instance.userData.addItem(itemId, amount, {
                notify: false,
                type: 'TaskReward'
            });

            this._flyReward(itemId, amount);
            this.reportEarnTask();
            director.emit(GlobalEvent.TaskEarn);
        }
    }

    showRemove() {
        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(0.3, { scale: Vec3.ZERO })
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.delegate.onItemSelectRemove(this);
                }
            })
            .start();
    }

    reportEarnTask() {
        const data = {
            Task_ID: this.taskData.id,
            Reward: this.taskCfg.rewards,
            Task_Type: this.taskCfg.time
        };
        AnalyticsManager.getInstance().reportTaskReward(data);
    }

    showEarnAnim() {
        this.hideEarnAnim();
        tween(this.earnBtn.node)
            .to(0.8, { scale: new Vec3(1.1, 1.1, 1.1) }, { easing: 'sineInOut' })
            .to(0.8, { scale: Vec3.ONE }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    hideEarnAnim() {
        Tween.stopAllByTarget(this.earnBtn.node);
        this.earnBtn.node.scale = Vec3.ONE;
    }

    _flyReward(itemId: number, amount: number) {
        if (itemId === ITEM.Light) {
            this._createFlyLight(itemId, amount);
        } else {
            const currentAmount = MgrUser.Instance.userData.getItem(itemId);
            MgrUser.Instance.userData.flyAddItem({
                itemId: itemId,
                change: amount,
                result: currentAmount,
                sourcePos: this.rewardLabel.node.getWorldPosition()
            });
            this.showRemove();
        }
    }

    _createFlyLight(itemId: number, amount: number) {
        if (this._taskAsync) {
            this._taskAsync.clear();
        }
        
        this._taskAsync = new AsyncQueue();
        
        this._taskAsync.push((next) => {
            AppGame.topUI.lightningItem.show(0.1, next);
        });
        
        this._taskAsync.push((next) => {
            const currentAmount = MgrUser.Instance.userData.getItem(itemId);
            MgrUser.Instance.userData.flyAddItem({
                itemId: itemId,
                change: amount,
                result: currentAmount,
                sourcePos: this.rewardLabel.node.getWorldPosition(),
                callback: next
            });
        });
        
        this._taskAsync.push((next) => {
            this.scheduleOnce(() => {
                next();
            }, 0.3);
        });
        
        this._taskAsync.push((next) => {
            AppGame.topUI.lightningItem.hide();
            next();
        });
        
        this._taskAsync.complete = () => {
            this._taskFinish = true;
            this.showRemove();
        };
        
        this._taskAsync.play();
        this._taskStart = true;
    }
}