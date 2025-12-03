import { _decorator, Component, Node, Label, Button, tween, Tween, UIOpacity, NodeEventType, Vec3, easing, isValid, director } from 'cc';
import DailyRewardCfg from './DailyRewardCfg';
import {Utils} from './Utils';
import {UIIcon} from './UIIcon';
import {AssetsCfg} from './AssetsCfg';
import { MgrUser } from './MgrUser';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrDailyReward } from './MgrDailyReward';
import { GlobalEvent } from './Events';
import {Language} from './Language';
import {AudioPlayer} from './AudioPlayer';
import { GameAudios } from './Prefabs';
import { AdsManager } from './AdsManager';
import {Toast} from './Toast';
import { MgrTask } from './MgrTask';
import { TASK_TYPE } from './Const';
import { GameConst } from './GameConst';

const { ccclass, property } = _decorator;

enum ViewState {
    Wait = 0,
    Open = 1,
    Earn = 2,
    Close = 3,
}

@ccclass('UIDailyRewardView')
export default class UIDailyRewardView extends Component {
    @property(Node)
    public waitNode: Node | null = null;

    @property(Node)
    public earnNode: Node | null = null;

    @property(Node)
    public earnPanel: Node | null = null;

    @property([Node])
    public boxList: Node[] = [];

    @property(Label)
    public tipsLabel: Label | null = null;

    @property(Node)
    public rewardNode: Node | null = null;

    @property(Node)
    public effectShain: Node | null = null;

    @property(UIIcon)
    public rewardIcon: UIIcon | null = null;

    @property(Label)
    public rewardNum: Label | null = null;

    @property(Node)
    public btnNode: Node | null = null;

    @property(Button)
    public btnGet: Button | null = null;

    @property(Button)
    public btnAd: Button | null = null;

    public rewardCfgList: any[] | null = null;
    private _viewState: ViewState = ViewState.Wait;
    public rewards: string[] = [];

    get viewState(): ViewState {
        return this._viewState;
    }
    set viewState(v: ViewState) {
        this._viewState = v;
    }

    onLoad() {
        // empty
    }

    onEnable() {
        this.initCfgList();
        this.bindItemsHandel();

        this.viewState = ViewState.Wait;

        if (this.waitNode) this.waitNode.active = true;
        if (this.earnNode) this.earnNode.active = false;
        if (this.earnPanel) this.earnPanel.active = false;
        if (this.btnNode) this.btnNode.active = false;
        if (this.rewardNode) this.rewardNode.active = false;

        this.onBoxesTween();

        if (this.tipsLabel) {
            this.tipsLabel.string = Language.Instance.getLangByID('daily_reward_tip');
        }

        if (this.effectShain) {
            Tween.stopAllByTarget(this.effectShain);
        }

        if (this.btnGet && this.btnGet.node) {
            this.btnGet.node.active = false;
        }
    }

    bindItemsHandel() {
        this.boxList.forEach((box, idx) => {
            const comp = box.getComponent(UIOpacity);
            if (comp) comp.opacity = 255;
            box.on(NodeEventType.TOUCH_END, () => {
                this.onItemClick(idx);
            }, this);
        });

        if (this.btnGet && this.btnGet.node) {
            this.btnGet.node.on('click', this.onNormalGet, this);
        }
        if (this.btnAd && this.btnAd.node) {
            this.btnAd.node.on('click', this.onAdGet, this);
        }
    }

    onBoxesTween() {
        this.boxList.forEach(box => {
            box.setScale(Vec3.ONE);
            tween(box)
                .to(0.5, { scale: new Vec3(1.07, 1.07, 1.07) }, { easing: 'sineInOut' })
                .to(0.5, { scale: Vec3.ONE }, { easing: 'sineInOut' })
                .union()
                .repeatForever()
                .start();
        });
    }

    stopBoxesTween() {
        this.boxList.forEach(box => {
            Tween.stopAllByTarget(box);
            box.setScale(Vec3.ONE);
        });
    }

    onItemClick(index: number) {
        if (this.viewState === ViewState.Wait) {
            this.stopBoxesTween();
            AudioPlayer.Instance.playEffect(GameAudios.OpenBox.url);
            this.viewState = ViewState.Open;

            const box = this.boxList[index];
            const origPos = box.getPosition();

            if (this.earnNode) box.parent = this.earnNode;
            box.setSiblingIndex(0);

            if (this.waitNode) this.waitNode.active = false;
            if (this.earnNode) this.earnNode.active = true;
            if (this.earnPanel) this.earnPanel.active = false;

            Tween.stopAllByTarget(box);
            tween(box)
                .to(0.5, { position: new Vec3(0, -100, 0) })
                .call(() => {
                    this.onBoxOpen(box, index, origPos);
                })
                .start();
        }
    }

    onBoxOpen(box: Node, index: number, origPos: Vec3) {
        const top = box.getChildByName('top');
        if (!top) return;
        tween(top)
            .by(0.3, { position: new Vec3(0, 64, 0) })
            .call(() => {
                if (this.earnPanel) this.earnPanel.active = true;
                this.onRewardShow(box, index, origPos);
            })
            .start();
    }

    onRewardShow(box: Node, index: number, origPos: Vec3) {
        if (this.viewState !== ViewState.Open) return;

        if (this.effectShain) this.shainRotate();
        this.viewState = ViewState.Earn;

        this.rewards = [];
        if (this.rewardCfgList && this.rewardCfgList[index]) {
            this.rewards = String(this.rewardCfgList[index].rewards).split('|');
        }

        if (this.rewardIcon) {
            const itemId = Number(this.rewards[0]);
            const asset = AssetsCfg.Instance.get(itemId);
            if (asset) this.rewardIcon.icon = asset.icon;
        }

        if (this.rewardNum) {
            this.rewardNum.string = 'X ' + (this.rewards[1] || '0');
        }

        if (this.rewardNode) this.rewardNode.active = true;
        if (this.tipsLabel) this.tipsLabel.string = Language.Instance.getLangByID('congratulate');

        const opacityComp = box.getComponent(UIOpacity);
        if (opacityComp) {
            tween(opacityComp)
                .to(0.3, { opacity: 0 })
                .call(() => {
                    box.parent = this.waitNode!;
                    const comp = box.getComponent(UIOpacity);
                    if (comp) comp.opacity = 255;

                    const top = box.getChildByName('top');
                    if (top) {
                        const p = top.getPosition();
                        top.setPosition(p.x, p.y - 100, p.z);
                    }

                    box.setPosition(origPos);
                })
                .start();
        }

        if (this.rewardNode) {
            this.rewardNode.setScale(new Vec3(0, 0, 0));
            tween(this.rewardNode)
                .to(0.2, { scale: new Vec3(1.2, 1.2, 1) }, { easing: easing.quadOut })
                .to(0.1, { scale: Vec3.ONE }, { easing: easing.quadIn })
                .call(() => {
                    if (this.btnNode) this.btnNode.active = true;
                    this.scheduleOnce(() => {
                        if (this.btnGet && this.btnGet.node && isValid(this.btnGet.node)) {
                            this.btnGet.node.active = true;
                        }
                    }, GameConst.AdNext_Delay_Time);
                })
                .start();
        }
    }

    initCfgList() {
        this.rewardCfgList = [];
        const arr = Array.from(Object.values(DailyRewardCfg.Instance.getAll()));
        for (let i = 0; i < 3; i++) {
            const el = Utils.getElementByWeight(arr, x => x.weight);
            this.rewardCfgList.push(el);
        }
    }

    onNormalGet() {
        if (this.viewState === ViewState.Earn) {
            this.viewState = ViewState.Close;
            this.submitTask();
            const itemId = Number(this.rewards[0]);
            const itemCount = Number(this.rewards[1]);
            MgrUser.Instance.userData.addItem(itemId, itemCount, {
                sourcePos: this.rewardIcon!.node.getWorldPosition(),
                type: 'DailyReward',
            });
            MgrDailyReward.Instance.dailyReward.lastRewardTime = Date.now();
            director.emit(GlobalEvent.DailyRewardEarn);
            this.hideView();
        }
    }

    onAdGet() {
        if (this.viewState !== ViewState.Earn) return;
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'DailyReward',
            AdsType: 'AdDailyReward',
            onSucceed: () => {
                this.viewState = ViewState.Close;
                this.submitTask();
                const itemId = Number(this.rewards[0]);
                const itemCount = 2 * Number(this.rewards[1]);
                MgrUser.Instance.userData.addItem(itemId, itemCount, {
                    sourcePos: this.rewardIcon!.node.getWorldPosition(),
                    type: 'DailyReward',
                });
                MgrDailyReward.Instance.dailyReward.lastRewardTime = Date.now();
                director.emit(GlobalEvent.DailyRewardEarn);
                this.hideView();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            },
        });
    }

    hideView() {
        const comp = this.node.getComponent(ViewAnimCtrl);
        if (comp) comp.onClose();
    }

    onDisable() {
        if (this.effectShain) Tween.stopAllByTarget(this.effectShain);
    }

    shainRotate() {
        if (this.effectShain) {
            tween(this.effectShain)
                .by(1, { angle: -60 })
                .repeatForever()
                .start();
        }
    }

    submitTask() {
        MgrTask.Instance.data.addTaskData(TASK_TYPE.DAILY_REWARD, 1);
    }
}