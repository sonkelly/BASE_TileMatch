import { _decorator, Component, Node, Input, cclegacy } from 'cc';
import { ViewAnimCtrl, VIEW_ANIM_EVENT } from './ViewAnimCtrl';

const { ccclass, property, requireComponent, menu } = _decorator;

@ccclass('ViewTouchClose')
@menu('ViewAnim/ViewTouchClose')
@requireComponent(ViewAnimCtrl)
export class ViewTouchClose extends Component {
    @property(Node)
    background: Node | null = null;

    private closeEnable: boolean = false;

    onLoad() {
        this.background = this.background || this.node;
    }

    onEnable() {
        this.closeEnable = false;
        this.node.once(VIEW_ANIM_EVENT.InDone, this.onAnimDone, this);
        this.background!.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {
        this.node.targetOff(this);
    }

    private onAnimDone() {
        this.closeEnable = true;
    }

    private onTouchEnd() {
        if (this.closeEnable) {
            this.closeEnable = false;
            this.node.emit(VIEW_ANIM_EVENT.Close);
        }
    }
}