import { _decorator, Component, Button, Node, UIOpacity, v3, tween, easing, Tween } from 'cc';
import { AsyncQueue } from './AsyncQueue';

const { ccclass, property } = _decorator;

const initialScale = v3(0, 0, 0);
const targetScale = v3(1, 1, 1);
const arrowScale = v3(-1, 1, 1);
const stepDuration = 0.24;
const arrowDuration = 0.1;

@ccclass('WinStreakHelpView')
export class WinStreakHelpView extends Component {
    @property(Button)
    closeBtn: Button | null = null;

    @property(Node)
    contentNode: Node | null = null;

    @property(UIOpacity)
    step1: UIOpacity | null = null;

    @property(UIOpacity)
    step2: UIOpacity | null = null;

    @property(UIOpacity)
    step3: UIOpacity | null = null;

    @property(UIOpacity)
    arrow1: UIOpacity | null = null;

    @property(UIOpacity)
    arrow2: UIOpacity | null = null;

    protected _taskAsync: AsyncQueue | null = null;
    private _animDone: boolean = false;

    onLoad() {
        this.closeBtn?.node.on('click', this._oncloseBtn, this);
        this.contentNode?.on(Node.EventType.TOUCH_END, this._oncloseBtn, this);
    }

    onEnable() {
        this._resetStep();
        this._runHelpStep();
    }

    onDisable() {
        this._taskAsync?.clear();
        this._taskAsync = null;
        this.unscheduleAllCallbacks();
    }

    protected _runHelpStep() {
        this._animDone = false;
        this._taskAsync = new AsyncQueue();

        this._taskAsync.push((done) => {
            tween(this.step1)
                .delay(0.1)
                .to(stepDuration, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step1.node)
                .delay(0.1)
                .to(stepDuration, { scale: targetScale }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(done, 0.44);
        });

        this._taskAsync.push((done) => {
            tween(this.arrow1)
                .to(arrowDuration, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow1.node)
                .to(arrowDuration, { scale: targetScale }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(done, 0.2);
        });

        this._taskAsync.push((done) => {
            tween(this.step2)
                .to(stepDuration, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step2.node)
                .to(stepDuration, { scale: targetScale }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(done, stepDuration + 0.1);
        });

        this._taskAsync.push((done) => {
            tween(this.arrow2)
                .to(arrowDuration, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.arrow2.node)
                .to(arrowDuration, { scale: arrowScale }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(done, 0.2);
        });

        this._taskAsync.push((done) => {
            tween(this.step3)
                .to(stepDuration, { opacity: 255 }, { easing: easing.backOut })
                .start();
            tween(this.step3.node)
                .to(stepDuration, { scale: targetScale }, { easing: easing.backOut })
                .start();
            this.scheduleOnce(done, stepDuration + 0.1);
        });

        this._taskAsync.complete = () => {
            this._animDone = true;
        };

        this._taskAsync.play();
    }

    protected _resetStep() {
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

        this.step1.node.scale = initialScale;
        this.step2.node.scale = initialScale;
        this.step3.node.scale = initialScale;
        this.arrow1.node.scale = initialScale;
        this.arrow2.node.scale = initialScale;

        this.step1.opacity = 0;
        this.step2.opacity = 0;
        this.step3.opacity = 0;
        this.arrow1.opacity = 0;
        this.arrow2.opacity = 0;
    }

    private _oncloseBtn() {
        if (this._animDone) {
            this.node.emit('Close');
        }
    }
}