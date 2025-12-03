import { _decorator, Component, view, Camera } from 'cc';
const { ccclass } = _decorator;

@ccclass('CameraAdjust')
export default class CameraAdjust extends Component {
    onLoad() {
        const BASE_WIDTH = 1280;
        const visible = view.getVisibleSize();
        const scaled = (visible.height / visible.width > 1
            ? Math.floor(720 / visible.width * visible.height)
            : BASE_WIDTH) / BASE_WIDTH;

        const cam = this.getComponent(Camera);
        if (cam) {
            cam.orthoHeight *= scaled;
        }
    }
}