import { _decorator, CCBoolean, CCFloat, Button, NodeEventType, Component, cclegacy } from 'cc';
import { VIBRATE_ONESHOT } from './Const';
import { NativeBridge } from './NativeBridge';

const { ccclass, property, menu } = _decorator;

@ccclass('ButtonVibration')
@menu('Button/ButtonVibration')
export class ButtonVibration extends Component {
    @property
    useCustonDuration: boolean = false;

    @property({
        type: CCFloat,
        visible: function (this: ButtonVibration) {
            return this.useCustonDuration;
        }
    })
    duration: number = 0;

    onLoad() {
        const button = this.node.getComponent(Button);
        if (button) {
            this.node.on('click', this.onClick, this);
        } else {
            this.node.on(NodeEventType.TOUCH_END, this.onClick, this);
        }
    }

    onClick() {
        if (this.enabled) {
            const duration = this.useCustonDuration && this.duration ? this.duration : VIBRATE_ONESHOT;
            NativeBridge.Instance.vibrate(duration);
        }
    }
}