import { _decorator, Component, UITransform, screen, view, Size } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BackgroundFix')
export class BackgroundFix extends Component {
    private nodeWidth: number = 0;
    private nodeHeight: number = 0;

    onLoad() {
        const uiTransform = this.node.getComponent(UITransform);
        this.nodeWidth = uiTransform.width;
        this.nodeHeight = uiTransform.height;
    }

    onEnable() {
        this._fit();
        screen.on('window-resize', this._fit, this);
        screen.on('orientation-change', this._fit, this);
    }

    onDisable() {
        screen.off('window-resize', this._fit, this);
        screen.off('orientation-change', this._fit, this);
    }

    private _fit() {
        const uiTransform = this.node.getComponent(UITransform);
        const visibleSize: Size = view.getVisibleSize();
        
        const aspectRatio = this.nodeWidth / uiTransform.height;
        const scale = aspectRatio < visibleSize.width / visibleSize.height 
            ? visibleSize.width / this.nodeWidth 
            : visibleSize.height / uiTransform.height;
            
        this.node.setScale(scale, scale, scale);
    }
}