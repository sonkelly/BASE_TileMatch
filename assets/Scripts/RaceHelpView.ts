import { _decorator, Component, Node, Button, UIOpacity, director, tween, Tween, easing, v3, cclegacy } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AsyncQueue } from './AsyncQueue';
import { GlobalEvent } from './Events';
import { MgrRace, RaceState } from './MgrRace';

const { ccclass, property } = _decorator;

const vecZero = v3(0, 0, 0);
const vecOne = v3(1, 1, 1);
const fadeTime = 0.1;
const scaleTime = 0.24;

@ccclass('RaceHelpView')
export class RaceHelpView extends Component {
    @property(UIOpacity)
    step1: UIOpacity = null!;

    @property(UIOpacity)
    step2: UIOpacity = null!;

    @property(UIOpacity)
    step3: UIOpacity = null!;

    @property(UIOpacity)
    arrow1: UIOpacity = null!;

    @property(UIOpacity)
    arrow2: UIOpacity = null!;

    @property(Node)
    lightNode: Node = null!;

    @property(Button)
    backBtn: Button = null!;

    private _taskAsync: AsyncQueue | null = null;

    onLoad() {
        this.backBtn.node.on('click', this._onClickBack, this);
    }

    onEnable() {
        director.on(GlobalEvent.changeRaceState, this._refreshRaceState, this);
        this._startLightAction();
        this._resetStep();
        this._runHelpStep();
    }

    onDisable() {
        director.targetOff(this);
        this._stopLightAction();
        if (this._taskAsync) {
            this._taskAsync.clear();
            this._taskAsync = null;
        }
        this.unscheduleAllCallbacks();
    }

    private _startLightAction() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _stopLightAction() {
        Tween.stopAllByTarget(this.lightNode);
    }

    private _resetStep() {
        Tween.stopAllByTarget(this.step1);
        Tween.stopAllByTarget(this.step2);
        Tween.stopAllByTarget(this.step3);
        Tween.stopAllByTarget(this.arrow1);
        Tween.stopAllByTarget(this.arrow2);
        Tween.stopAllByTarget(this.step1.node);
        Tween.stopAllByTarget(this.step2.node);
        Tween.stopAllByTarget(this.step3.node);
        Tween.stopAllByTarget(this.arrow1.node);
        Tween.stopAllByTarget(this.arrow2.node);

        this.step1.node.scale = vecZero;
        this.step2.node.scale = vecZero;
        this.step3.node.scale = vecZero;
        this.arrow1.node.scale = vecZero;
        this.arrow2.node.scale = vecZero;

        this.step1.opacity = 0;
        this.step2.opacity = 0;
        this.step3.opacity = 0;
        this.arrow1.opacity = 0;
        this.arrow2.opacity = 0;
    }

    private _runHelpStep() {
        this._taskAsync = new AsyncQueue();

        this._taskAsync.push((next) => {
            tween(this.step1)
                .to(scaleTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step1.node)
                .to(scaleTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, scaleTime + 0.1);
        });

        this._taskAsync.push((next) => {
            tween(this.arrow1)
                .to(fadeTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow1.node)
                .to(fadeTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.2);
        });

        this._taskAsync.push((next) => {
            tween(this.step2)
                .to(scaleTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step2.node)
                .to(scaleTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, scaleTime + 0.1);
        });

        this._taskAsync.push((next) => {
            tween(this.arrow2)
                .to(fadeTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow2.node)
                .to(fadeTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.2);
        });

        this._taskAsync.push((next) => {
            tween(this.step3)
                .to(scaleTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step3.node)
                .to(scaleTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, scaleTime + 0.1);
        });

        this._taskAsync.complete = () => {};
        this._taskAsync.play();
    }

    private _onClickBack() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }

    private _refreshRaceState() {
        if (MgrRace.Instance.raceState === RaceState.None) {
            this._onClickBack();
        }
    }
}