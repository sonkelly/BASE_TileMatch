import { _decorator, CCFloat, Widget, tween, Component, Node } from 'cc';
import {ViewAnimBase} from './ViewAnimBase';

const { ccclass, property, menu } = _decorator;

export enum VIEW_ANIM_EVENT {
    Show = 'Show',
    Close = 'Close',
    Remove = 'Remove',
    Removed = 'Removed',
    InStart = 'anim-in-start',
    InDone = 'anim-in-done',
    OutStart = 'anim-out-start',
    OutDone = 'anim-out-done'
}

const STATE_IDLE = 0;
const STATE_ANIM_IN = 1;
const STATE_ANIM_OUT = 2;
const STATE_ANIM_DONE = 3;

@ccclass('ViewAnimCtrl')
@menu('ViewAnim/ViewAnimCtrl')
export class ViewAnimCtrl extends Component {
    @property({
        displayName: 'Start playback'
    })
    playOnLoad: boolean = true;

    @property({
        displayName: 'Delay time',
        visible() {
            return this.playOnLoad;
        }
    })
    playOnLoadDelay: number = 0;

    @property(CCFloat)
    logicInDuration: number = 0.12;

    @property(CCFloat)
    logicOutDuration: number = 0.1;

    private animComponents: ViewAnimBase[] = [];
    private state: number = STATE_IDLE;

    __preload() {
        const widget = this.getComponent(Widget);
        if (widget) {
            widget.updateAlignment();
            widget.enabled = widget.alignMode === Widget.AlignMode.ALWAYS || widget.alignMode === Widget.AlignMode.ON_WINDOW_RESIZE;
        }
    }

    onLoad() {
        this.animComponents = this.node.getComponentsInChildren(ViewAnimBase);
        this.node.on(VIEW_ANIM_EVENT.Show, this.onShowEvent, this);
        this.node.on(VIEW_ANIM_EVENT.Close, this.onCloseEvent, this);
    }

    onShowEvent() {
        this.state = STATE_ANIM_OUT;
        this.onShow();
    }

    onCloseEvent() {
        this.onClose();
    }

    onEnable() {
        this.state = STATE_ANIM_OUT;
        if (this.playOnLoad) {
            this.playOnLoadDelay = this.playOnLoadDelay ?? 0;
            if (this.playOnLoadDelay > 0) {
                this.scheduleOnce(() => {
                    this.onShow();
                }, this.playOnLoadDelay);
            } else {
                this.onShow();
            }
        }
    }

    private _runInAction(callback: Function) {
        for (let i = 0; i < this.animComponents.length; i++) {
            this.animComponents[i].runInAction(this.logicInDuration);
        }
        tween(this.node).delay(this.logicInDuration).call(callback).start();
    }

    private _runOutAction(callback: Function) {
        for (let i = 0; i < this.animComponents.length; i++) {
            this.animComponents[i].runOutAction(this.logicOutDuration);
        }
        tween(this.node).delay(this.logicOutDuration).call(callback).start();
    }

    onShow() {
        this.state = STATE_ANIM_IN;
        this._runInAction(() => {
            this.state = STATE_ANIM_OUT;
            this.node.emit(VIEW_ANIM_EVENT.InDone);
        });
        this.node.emit(VIEW_ANIM_EVENT.InStart);
    }

    onClose() {
        if (this.state >= STATE_ANIM_DONE) return;
        this.state = STATE_ANIM_DONE;
        this._runOutAction(() => {
            this.node.emit(VIEW_ANIM_EVENT.OutDone);
            this.node.emit(VIEW_ANIM_EVENT.Remove, this);
        });
        this.node.emit(VIEW_ANIM_EVENT.OutStart);
    }

    isAnimIn() {
        return this.state === STATE_ANIM_IN;
    }
}