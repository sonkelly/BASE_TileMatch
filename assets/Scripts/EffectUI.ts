import { _decorator, Component, view, Size } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EffectUI')
export class EffectUI extends Component {
    onEnable() {
        const visibleSize: Size = view.getVisibleSize();
        const aspectRatio = visibleSize.width / visibleSize.height;
        const scale = (0.5625 / aspectRatio) * 100;
        this.node.setScale(scale, scale, scale);
    }
}