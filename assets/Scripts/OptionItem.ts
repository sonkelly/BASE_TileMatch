import { _decorator, Component, Node, Sprite, Label, Button, Color, Vec3, Enum, director } from 'cc';
import { ITEM, GameConst } from './GameConst';
import { GlobalEvent } from './Events';
import { MgrGame } from './MgrGame';
import { LanguageEvent, Language } from './Language';
import { MgrUser } from './MgrUser';
import { MgrAnalytics } from './MgrAnalytics';
import { AdsManager } from './AdsManager';
import { Toast } from './Toast';
import { MgrTask } from './MgrTask';
import { TASK_TYPE } from './Const';

const { ccclass, property } = _decorator;

enum OptionItemType {
    UNDO = ITEM.Back,
    WAND = ITEM.Hint,
    SHUFFLE = ITEM.Fresh
}

@ccclass('OptionItem')
export class OptionItem extends Component {
    @property(Sprite)
    icon: Sprite | null = null;

    @property(Node)
    lockNode: Node | null = null;

    @property(Node)
    unlockNode: Node | null = null;

    @property(Label)
    lockLv: Label | null = null;

    @property(Node)
    countNode: Node | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Node)
    goldCost: Node | null = null;

    @property(Label)
    costLabel: Label | null = null;

    @property(Node)
    adNode: Node | null = null;

    @property({
        type: Enum(OptionItemType)
    })
    item: OptionItemType = OptionItemType.UNDO;

    private _isOnAnim: boolean = false;

    onEnable() {
        this.clearAnim();
        director.on(GlobalEvent.AssetItemChange + this.item, this.fresh, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.Coin, this.fresh, this);
        director.on(LanguageEvent.CHANGE, this.fresh, this);
    }

    clearAnim() {
        this.node.angle = 0;
        this._isOnAnim = false;
    }

    onDisable() {
        director.targetOff(this);
    }

    onClickHandel(callback?: Function) {
        if (MgrUser.Instance.userData.getItem(Number(this.item)) > 0) {
            MgrUser.Instance.userData.subItem(Number(this.item), 1, { type: 'UseProp' });
            callback && callback();
            this.submitTask();
        } else {
            const cost = this.getCost();
            if (MgrUser.Instance.userData.judgeItem(ITEM.Coin, cost)) {
                MgrUser.Instance.userData.subItem(ITEM.Coin, cost, {
                    type: MgrAnalytics.Instance.getCoinUseType(Number(this.item))
                });
                MgrUser.Instance.userData.reportAddItem(Number(this.item), 'InGame', 1);
                MgrUser.Instance.userData.reportUseItem(Number(this.item), 'InGame', 1);
                director.emit(GlobalEvent.GameUseGoldBuyProp, this.item);
                callback && callback();
                this.submitTask();
            } else {
                AdsManager.getInstance().showRewardedVideo({
                    OpenUi: 'MainGame',
                    AdsType: MgrAnalytics.Instance.getAdsTypeInGame(Number(this.item)),
                    onSucceed: () => {
                        MgrUser.Instance.userData.reportAddItem(Number(this.item), 'InGame', 1);
                        MgrUser.Instance.userData.reportUseItem(Number(this.item), 'InGame', 1);
                        director.emit(GlobalEvent.GameUseAdGetProp, this.item);
                        callback && callback();
                        this.submitTask();
                    },
                    onFail: () => {
                        Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
                    }
                });
            }
        }
    }

    fresh() {
        switch (this.item) {
            case OptionItemType.UNDO:
                this.showItem(GameConst.PropUndoLockLv);
                break;
            case OptionItemType.WAND:
                this.showItem(GameConst.PropWandLockLv);
                break;
            case OptionItemType.SHUFFLE:
                this.showItem(GameConst.PropShuffleLockLv);
        }
    }

    showItem(unlockLevel: number) {
        if (MgrGame.Instance.gameData.maxLv < unlockLevel) {
            this.node.getComponent(Button)!.interactable = false;
            this.unlockNode!.active = false;
            this.lockNode!.active = true;
            this.icon!.color = Color.GRAY;
            this.icon!.node.scale = Vec3.ONE;
            this.lockLv!.string = Language.Instance.getLangByID('lockLv') + unlockLevel;
            console.log("Language.Instance.getLangByID('lockLv')", Language.Instance.getLangByID('lockLv'))
        } else {
            this.node.getComponent(Button)!.interactable = true;
            this.lockNode!.active = false;
            this.unlockNode!.active = true;
            this.icon!.color = Color.WHITE;
            this.icon!.node.scale = new Vec3(1.2, 1.2, 1.2);
            
            const count = MgrUser.Instance.userData.getItem(Number(this.item));
            if (count > 0) {
                this.countNode!.active = true;
                this.countLabel!.string = count.toString();
                this.goldCost!.active = false;
                this.adNode!.active = false;
            } else {
                const cost = this.getCost();
                if (MgrUser.Instance.userData.judgeItem(ITEM.Coin, cost)) {
                    this.countNode!.active = false;
                    this.goldCost!.active = true;
                    this.costLabel!.string = cost.toString();
                    this.adNode!.active = false;
                } else {
                    this.countNode!.active = false;
                    this.goldCost!.active = false;
                    this.adNode!.active = true;
                }
            }
        }
    }

    getCost(): number {
        switch (this.item) {
            case OptionItemType.UNDO:
                return GameConst.PropUndoCost;
            case OptionItemType.WAND:
                return GameConst.PropWandCost;
            case OptionItemType.SHUFFLE:
                return GameConst.PropShuffleCost;
            default:
                return 0;
        }
    }

    getUnlockLv(): number {
        switch (this.item) {
            case OptionItemType.UNDO:
                return GameConst.PropUndoLockLv;
            case OptionItemType.WAND:
                return GameConst.PropWandLockLv;
            case OptionItemType.SHUFFLE:
                return GameConst.PropShuffleLockLv;
            default:
                return 10;
        }
    }

    submitTask() {
        switch (this.item) {
            case OptionItemType.UNDO:
                MgrTask.Instance.data.addTaskData(TASK_TYPE.UNDO, 1);
                MgrTask.Instance.data.addTaskData(TASK_TYPE.USE_PROP, 1);
                break;
            case OptionItemType.WAND:
                MgrTask.Instance.data.addTaskData(TASK_TYPE.WAND, 1);
                MgrTask.Instance.data.addTaskData(TASK_TYPE.USE_PROP, 1);
                break;
            case OptionItemType.SHUFFLE:
                MgrTask.Instance.data.addTaskData(TASK_TYPE.FRESH, 1);
                MgrTask.Instance.data.addTaskData(TASK_TYPE.USE_PROP, 1);
        }
    }
}