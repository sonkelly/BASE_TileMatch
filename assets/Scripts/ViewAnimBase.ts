import { _decorator, Component, SafeArea, Widget, cclegacy } from 'cc';
const { ccclass, menu, property } = _decorator;

@ccclass('ViewAnimBase')
@menu('ViewAnim/ViewAnimBase')
export class ViewAnimBase extends Component {
    private _inited: boolean = false;

    __preload(): void {
        this._inited = false;
        const safeArea = this.getComponent(SafeArea);
        if (safeArea) {
            safeArea.updateArea();
        } else {
            const widget = this.getComponent(Widget);
            if (widget) {
                widget.updateAlignment();
                widget.enabled = widget.alignMode === Widget.AlignMode.ALWAYS || 
                                widget.alignMode === Widget.AlignMode.ON_WINDOW_RESIZE;
            }
        }
        this.initialize();
    }

    protected initialize(): void {
        // To be implemented by subclasses
    }
}