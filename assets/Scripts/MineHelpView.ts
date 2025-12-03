import { _decorator, Component, Node, Button, UIOpacity, director, Tween, tween, easing, v3, cclegacy } from 'cc';
import { AsyncQueue } from './AsyncQueue';
import { GlobalEvent } from './Events';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrMine, MineActivityStatus } from './MgrMine';

const { ccclass, property } = _decorator;

const vecZero = v3(0, 0, 0);
const vecOne = v3(1, 1, 1);
const fadeInTime = 0.1;
const scaleInTime = 0.16;

@ccclass('MineHelpView')
export class MineHelpView extends Component {
    @property(UIOpacity)
    step1: UIOpacity | null = null;

    @property(UIOpacity)
    step2: UIOpacity | null = null;

    @property(UIOpacity)
    step3: UIOpacity | null = null;

    @property(UIOpacity)
    step4: UIOpacity | null = null;

    @property(UIOpacity)
    arrow1: UIOpacity | null = null;

    @property(UIOpacity)
    arrow2: UIOpacity | null = null;

    @property(UIOpacity)
    arrow3: UIOpacity | null = null;

    @property(Node)
    lightNode1: Node | null = null;

    @property(Node)
    lightNode2: Node | null = null;

    @property(Button)
    backBtn: Button | null = null;

    private _taskAsync: AsyncQueue | null = null;

    onLoad() {
        this.backBtn!.node.on('click', this._onClickBack, this);
    }

    onEnable() {
        director.on(GlobalEvent.MineStateChange, this._refreshState, this);
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

    private _stopLightAction() {
        Tween.stopAllByTarget(this.lightNode1!);
        Tween.stopAllByTarget(this.lightNode1!.getComponent(UIOpacity)!);
        Tween.stopAllByTarget(this.lightNode2!);
        Tween.stopAllByTarget(this.lightNode2!.getComponent(UIOpacity)!);
    }

    private _resetStep() {
        Tween.stopAllByTarget(this.step1!);
        Tween.stopAllByTarget(this.step2!);
        Tween.stopAllByTarget(this.step3!);
        Tween.stopAllByTarget(this.arrow1!);
        Tween.stopAllByTarget(this.arrow2!);
        Tween.stopAllByTarget(this.step1!.node);
        Tween.stopAllByTarget(this.step2!.node);
        Tween.stopAllByTarget(this.step3!.node);
        Tween.stopAllByTarget(this.arrow1!.node);
        Tween.stopAllByTarget(this.arrow2!.node);

        this.step1!.node.scale = vecZero;
        this.step2!.node.scale = vecZero;
        this.step3!.node.scale = vecZero;
        this.step4!.node.scale = vecZero;
        this.arrow1!.node.scale = vecZero;
        this.arrow2!.node.scale = vecZero;
        this.arrow3!.node.scale = vecZero;

        this.step1!.opacity = 0;
        this.step2!.opacity = 0;
        this.step3!.opacity = 0;
        this.step4!.opacity = 0;
        this.arrow1!.opacity = 0;
        this.arrow2!.opacity = 0;
        this.arrow3!.opacity = 0;
    }

    private _runHelpStep() {
        this._taskAsync = new AsyncQueue();

        this._taskAsync.push((next) => {
            tween(this.step1!)
                .to(scaleInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step1!.node)
                .to(scaleInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.26);
        });

        this._taskAsync.push((next) => {
            tween(this.arrow1!)
                .to(fadeInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow1!.node)
                .to(fadeInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.2);
        });

        this._taskAsync.push((next) => {
            tween(this.lightNode1!.getComponent(UIOpacity)!)
                .set({ opacity: 0 })
                .to(fadeInTime, { opacity: 200 })
                .start();
            tween(this.lightNode1!)
                .set({ eulerAngles: v3(0, 0, 0) })
                .to(18, { eulerAngles: v3(0, 0, -360) })
                .union()
                .repeatForever()
                .start();
            tween(this.step2!)
                .to(scaleInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step2!.node)
                .to(scaleInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.26);
        });

        this._taskAsync.push((next) => {
            tween(this.arrow2!)
                .to(fadeInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow2!.node)
                .to(fadeInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.2);
        });

        this._taskAsync.push((next) => {
            tween(this.step3!)
                .to(scaleInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step3!.node)
                .to(scaleInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.26);
        });

        this._taskAsync.push((next) => {
            tween(this.arrow3!)
                .to(fadeInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow3!.node)
                .to(fadeInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.2);
        });

        this._taskAsync.push((next) => {
            tween(this.lightNode2!.getComponent(UIOpacity)!)
                .set({ opacity: 0 })
                .to(fadeInTime, { opacity: 200 })
                .start();
            tween(this.lightNode2!)
                .set({ eulerAngles: v3(0, 0, 0) })
                .to(18, { eulerAngles: v3(0, 0, -360) })
                .union()
                .repeatForever()
                .start();
            tween(this.step4!)
                .to(scaleInTime, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step4!.node)
                .to(scaleInTime, { scale: vecOne }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(next, 0.26);
        });

        this._taskAsync.complete = () => {};
        this._taskAsync.play();
    }

    private _onClickBack() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }

    private _refreshState() {
        if (MgrMine.Instance.status === MineActivityStatus.Wait) {
            this._onClickBack();
        }
    }
}