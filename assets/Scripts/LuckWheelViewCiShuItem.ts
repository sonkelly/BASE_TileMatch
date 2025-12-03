import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LuckWheelViewCiShuItem')
export class LuckWheelViewCiShuItem extends Component {
    @property(Node)
    partNode: Node | null = null;

    setShow(isVisible: boolean) {
        if (this.partNode) {
            this.partNode.active = isVisible;
        }
    }
}