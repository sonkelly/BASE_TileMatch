import { _decorator, Component, Node, Label, Vec3, director, Tween, UIOpacity, tween, v3, easing, cclegacy } from 'cc';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import {Utils} from './Utils';
import { AppGame } from './AppGame';
import { TopUIItem } from './TopUIItem';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('StreakBtnV2')
export class StreakBtnV2 extends Component {
    @property(TopUIItem)
    streakBtn: TopUIItem = null!;

    @property(Node)
    streakScaleNode: Node = null!;

    @property(Node)
    streakDot: Node = null!;

    @property(Label)
    streakWinLabel: Label = null!;

    @property(Label)
    streakTimeLabel: Label = null!;

    @property(Node)
    streakUp: Node = null!;

    @property(Label)
    streakUpLabel: Label = null!;

    private _upStartPos: Vec3 = new Vec3();

    onLoad() {
        this.node.on('click', this.onStreakBtn, this);
        this._upStartPos.set(this.streakUp.position);
    }

    onEnable() {
        this.checkRedDot();
        this.refreshTime();
        director.on(GlobalEvent.GameAutoPopComplete, this.onAutoComplete, this);
    }

    onDisable() {
        this.removeRegister();
    }

    addRegister() {
        this.timer();
        this.schedule(this.timer, 1);
    }

    removeRegister() {
        this.unschedule(this.timer);
        director.targetOff(this);
    }

    onAutoComplete() {
        this.addRegister();
    }

    timer() {
        if (MgrWinStreakV2.Instance.getRemainTime() <= 0) {
            this.removeRegister();
            AppGame.Ins.addAutoFlow((callback: Function) => {
                this.streakBtn.hide();
                MgrWinStreakV2.Instance.tryAutoReward(callback);
                MgrWinStreakV2.Instance.checkResetData();
            });
        }
        this.refreshTime();
    }

    refreshTime() {
        const time = MgrWinStreakV2.Instance.getRemainTime();
        const timeStr = Utils.timeConvertToHHMM(time);
        this.streakTimeLabel.string = timeStr;
    }

    checkRedDot() {
        this.streakDot.active = MgrWinStreakV2.Instance.getRdEnable();
    }

    updateCount() {
        const maxNum = WinStreakV2Cfg.Instance.getMaxNum();
        const curTime = MgrWinStreakV2.Instance.data.curTime;
        const count = Math.min(maxNum, curTime);
        this.streakWinLabel.string = count.toString();
    }

    showStreakLabel() {
        const label = this.streakWinLabel;
        this.streakUp.active = false;
        this.streakUpLabel.node.active = false;

        const maxNum = WinStreakV2Cfg.Instance.getMaxNum();
        const curTime = MgrWinStreakV2.Instance.data.curTime;
        const count = Math.min(maxNum, curTime);

        if (Number(label.string) > curTime) {
            label.string = count.toString();
        } else {
            const diff = count - Number(label.string);
            if (diff <= 0) {
                label.string = count.toString();
                return;
            }

            Tween.stopAllByTarget(this.streakUpLabel.node);
            this.streakUpLabel.node.active = true;
            this.streakUpLabel.string = '+' + diff;
            this.streakUpLabel.node.setPosition(this._upStartPos);

            const opacityComp = this.streakUpLabel.getComponent(UIOpacity)!;
            opacityComp.opacity = 0;
            Tween.stopAllByTarget(opacityComp);
            tween(opacityComp)
                .delay(0.7)
                .set({ opacity: 255 })
                .delay(0.9)
                .to(0.4, { opacity: 0 })
                .start();

            tween(this.streakUpLabel.node)
                .delay(0.7)
                .to(1.3, { position: v3(this._upStartPos.x, this._upStartPos.y + 40, 0) }, { easing: easing.sineOut })
                .call(() => {
                    this.streakUpLabel.node.active = false;
                })
                .start();

            this.streakUp.active = true;
            Tween.stopAllByTarget(this.streakUp);
            this.streakUp.setPosition(this._upStartPos);
            this.streakUp.scale = Vec3.ZERO;

            tween(this.streakUp)
                .to(0.2, { scale: v3(1.3, 1.3, 1.3) })
                .to(0.1, { scale: v3(1, 1, 1) })
                .delay(0.4)
                .to(0.3, { position: Vec3.ZERO })
                .to(0.13, { scale: Vec3.ZERO })
                .call(() => {
                    label.string = count.toString();
                    this.streakUp.active = false;
                    tween(this.streakScaleNode)
                        .to(0.1, { scale: new Vec3(1.1, 1.1, 1.1) })
                        .to(0.1, { scale: Vec3.ONE })
                        .start();
                })
                .start();
        }
    }

    onStreakBtn() {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakViewV2, {
            root: MgrUi.root(1)
        });
    }
}