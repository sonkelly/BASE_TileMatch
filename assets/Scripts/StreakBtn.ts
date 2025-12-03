import { _decorator, Component, Node, Label, Vec3, director, Tween, tween, UIOpacity, easing, cclegacy } from 'cc';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { MgrWinStreak } from './MgrWinStreak';
import { Utils } from './Utils';
import { AppGame } from './AppGame';
import { WinStreakCfg } from './WinStreakCfg';
import { TopUIItem } from './TopUIItem';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('StreakBtn')
export class StreakBtn extends Component {
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
        Vec3.copy(this._upStartPos, this.streakUp.position);
    }

    onEnable() {
        this.checkRedDot();
        this.refreshTime();
        director.on(GlobalEvent.GameAutoPopComplete, this.onAutoComplete, this);
    }

    onDisable() {
        this.removeRegister();
    }

    private addRegister() {
        this.timer();
        this.schedule(this.timer, 1);
    }

    private removeRegister() {
        this.unschedule(this.timer);
        director.targetOff(this);
    }

    private onAutoComplete() {
        this.addRegister();
    }

    private timer() {
        if (MgrWinStreak.Instance.getRemainTime() <= 0) {
            this.removeRegister();
            AppGame.Ins.addAutoFlow((complete: Function) => {
                this.streakBtn.hide();
                MgrWinStreak.Instance.tryAutoReward(complete);
                MgrWinStreak.Instance.checkResetData();
            });
        }
        this.refreshTime();
    }

    private refreshTime() {
        const time = MgrWinStreak.Instance.getRemainTime();
        const timeStr = Utils.timeConvertToHHMM(time);
        this.streakTimeLabel.string = timeStr;
    }

    private checkRedDot() {
        this.streakDot.active = MgrWinStreak.Instance.getRdEnable();
    }

    updateCount() {
        const maxNum = WinStreakCfg.Instance.getMaxNum();
        const curTime = MgrWinStreak.Instance.data.curTime;
        const count = Math.min(maxNum, curTime);
        this.streakWinLabel.string = count.toString();
    }

    showStreakLabel() {
        const self = this;
        const label = this.streakWinLabel;
        
        this.streakUp.active = false;
        this.streakUpLabel.node.active = false;

        const maxNum = WinStreakCfg.Instance.getMaxNum();
        const curTime = MgrWinStreak.Instance.data.curTime;
        const currentCount = Math.min(maxNum, curTime);

        if (Number(label.string) > curTime) {
            label.string = currentCount.toString();
        } else {
            const diff = currentCount - Number(label.string);
            if (diff <= 0) {
                label.string = currentCount.toString();
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
                .to(1.3, { position: new Vec3(this._upStartPos.x, this._upStartPos.y + 40, 0) }, { easing: easing.sineOut })
                .call(() => { self.streakUpLabel.node.active = false; })
                .start();

            this.streakUp.active = true;
            Tween.stopAllByTarget(this.streakUp);
            this.streakUp.setPosition(this._upStartPos);
            this.streakUp.scale = Vec3.ZERO;

            tween(this.streakUp)
                .to(0.2, { scale: new Vec3(1.3, 1.3, 1.3) })
                .to(0.1, { scale: Vec3.ONE })
                .delay(0.4)
                .to(0.3, { position: Vec3.ZERO })
                .to(0.13, { scale: Vec3.ZERO })
                .call(() => {
                    label.string = currentCount.toString();
                    self.streakUp.active = false;
                    tween(self.streakScaleNode)
                        .to(0.1, { scale: new Vec3(1.1, 1.1, 1.1) })
                        .to(0.1, { scale: Vec3.ONE })
                        .start();
                })
                .start();
        }
    }

    private onStreakBtn() {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakView, {
            root: MgrUi.root(1)
        });
    }
}