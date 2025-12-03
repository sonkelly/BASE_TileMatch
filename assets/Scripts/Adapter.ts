import { _decorator, Component, Widget, sys, SafeArea, CCBoolean, cclegacy } from 'cc';
import { default as AdapterTT } from './AdapterTT';
import { default as AdapterWx } from './AdapterWx';

const { ccclass, property } = _decorator;

enum AdpterDir {
    Bottom = 1,
    Left = 2
}

const platformAdapters = {
    [sys.Platform.WECHAT_GAME]: AdapterWx,
    [sys.Platform.BYTEDANCE_MINI_GAME]: AdapterTT
};

@ccclass('Adapter')
export class Adapter extends Component {
    @property(SafeArea)
    safeArea: SafeArea | null = null;

    @property(CCBoolean)
    adapterTop: boolean = true;

    @property(CCBoolean)
    adapterRight: boolean = true;

    start() {
        const adapter = platformAdapters[sys.platform];
        if (adapter) {
            const widget = this.node.getComponent(Widget);
            if (widget) {
                console.log('this.adapterTop', this.adapterTop, this.adapterRight);
                if (this.adapterTop) {
                    adapter.top(widget, this.safeArea);
                }
                if (this.adapterRight) {
                    adapter.right(widget, this.safeArea);
                }
            }
        }
    }

    static setKeepScreenOn(enable: boolean) {
        const adapter = platformAdapters[sys.platform];
        if (adapter) {
            adapter.setKeepScreenOn(enable);
        }
    }
}