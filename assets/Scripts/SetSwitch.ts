import { _decorator, Component, Node, CCClass } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SetSwitch')
export class SetSwitch extends Component {
    @property(Node)
    on: Node = null!;

    @property(Node)
    off: Node = null!;

    setSwitch(active: boolean): void {
        this.on.active = active;
        this.off.active = !active;
    }
}