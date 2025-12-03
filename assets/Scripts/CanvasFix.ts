import { _decorator, Component, view, ResolutionPolicy, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CanvasFix')
export class CanvasFix extends Component {
    onLoad() {
        const visibleSize = view.getVisibleSize();
        const designSize = view.getDesignResolutionSize();
        
        if (visibleSize.width / visibleSize.height > designSize.width / designSize.height) {
            view.setResolutionPolicy(ResolutionPolicy.SHOW_ALL);
            view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.SHOW_ALL);
        } else if (visibleSize.width / visibleSize.height > designSize.width / designSize.height) {
            view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
        }
    }
}