import { _decorator, Node, Sprite, Label, Vec3, director, Button, Tween, UIOpacity, tween, v3, easing, Component } from 'cc';
import { MgrRace, RaceState, RaceMaxProgress } from './MgrRace';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { GlobalEvent } from './Events';
import {Utils} from './Utils';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';

const { ccclass, property } = _decorator;

@ccclass('RaceBtn')
export class RaceBtn extends Component {
    @property(Node)
    gressbar: Node | null = null;

    @property(Sprite)
    roundGress: Sprite | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Node)
    upNode: Node | null = null;

    @property(Label)
    upLabel: Label | null = null;

    private _upStartPos: Vec3 = new Vec3();
    private _realStep: number = 0;
    private _isAddStep: boolean = false;

    onLoad() {
        this.node.on('click', this._onRaceBtn, this);
        director.on(GlobalEvent.SettementRaceTurn, this._refreshSelfProgress, this);
        director.on(GlobalEvent.refreshRaceTime, this._refreshRaceTime, this);
        director.on(GlobalEvent.refreshIconProgress, this._refreshGrassBar, this);
        this._upStartPos.set(this.upNode.position);
    }

    onDestroy() {
        director.off(GlobalEvent.SettementRaceTurn, this._refreshSelfProgress, this);
        director.off(GlobalEvent.refreshRaceTime, this._refreshRaceTime, this);
        director.off(GlobalEvent.refreshIconProgress, this._refreshGrassBar, this);
    }

    start() {
        this._refreshSelfProgress();
        this._refreshGrassBar();
    }

    onEnable() {
        this.getComponent(Button).interactable = true;
        this._refreshRaceTime();
    }

    private _refreshSelfProgress() {
        const progressRatio = 0.4 / RaceMaxProgress;
        this.roundGress.fillRange = MgrRace.Instance.data.realStep * progressRatio;
        this._realStep = MgrRace.Instance.data.realStep;
    }

    private _refreshRaceTime() {
        const remainTime = MgrRace.Instance.getRemainTime();
        if (remainTime <= 0) {
            this.timeLabel.string = '';
        } else {
            const timeStr = Utils.timeConvertToHHMM(remainTime);
            this.timeLabel.string = `${timeStr}`;
        }
    }

    private _refreshGrassBar() {
        this.gressbar.active = MgrRace.Instance.raceState === RaceState.TurnRace;
        this._refreshSelfProgress();
    }

    showLabel() {
        if (this.upNode.active = false, this.upLabel.node.active = false, this._realStep === MgrRace.Instance.data.realStep) {
            return false;
        }

        this.getComponent(Button).interactable = false;
        Tween.stopAllByTarget(this.upLabel.node);
        this.upLabel.node.active = true;
        this.upLabel.string = `+${MgrRace.Instance.data.realStep - this._realStep}`;
        this.upLabel.node.setPosition(this._upStartPos);

        const upLabelOpacity = this.upLabel.getComponent(UIOpacity);
        upLabelOpacity.opacity = 0;
        Tween.stopAllByTarget(upLabelOpacity);

        tween(upLabelOpacity)
            .delay(0.7)
            .set({ opacity: 255 })
            .delay(0.9)
            .to(0.4, { opacity: 0 })
            .start();

        tween(this.upLabel.node)
            .delay(0.7)
            .to(1.3, { position: v3(this._upStartPos.x, this._upStartPos.y + 40, 0) }, { easing: easing.sineOut })
            .call(() => {
                this.upLabel.node.active = false;
            })
            .start();

        this.upNode.active = true;
        Tween.stopAllByTarget(this.upNode);
        this.upNode.setPosition(this._upStartPos);
        this.upNode.scale = Vec3.ZERO;

        tween(this.upNode)
            .to(0.2, { scale: v3(1.3, 1.3, 1.3) })
            .to(0.1, { scale: v3(1, 1, 1) })
            .delay(0.4)
            .to(0.3, { position: Vec3.ZERO })
            .to(0.13, { scale: Vec3.ZERO })
            .call(() => {
                this._refreshSelfProgress();
                this.getComponent(Button).interactable = true;
            })
            .start();

        this._isAddStep = true;
        return true;
    }

    checkStep(callback: Function) {
        if (!this._isAddStep) {
            MgrRace.Instance.checkCanEndRace();
            if (MgrRace.Instance.raceState === RaceState.TurnOver) {
                MgrUi.Instance.openViewAsync(UIPrefabs.RaceView, {
                    callback: (view) => {
                        view.once(VIEW_ANIM_EVENT.Removed, () => {
                            callback && callback();
                        });
                    }
                });
            } else {
                callback();
            }
            return;
        }

        this._isAddStep = false;
        MgrRace.Instance.checkCanEndRace();
        MgrUi.Instance.openViewAsync(UIPrefabs.RaceView, {
            callback: (view) => {
                view.once(VIEW_ANIM_EVENT.Removed, () => {
                    callback && callback();
                });
            }
        });
    }

    private _onRaceBtn() {
        const openView = MgrRace.Instance.getOpenView();
        if (openView) {
            MgrUi.Instance.addViewAsyncQueue(openView);
        }
    }
}