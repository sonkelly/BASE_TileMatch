import { _decorator, ScrollView, Button, Component } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrToyRace } from './MgrToyRace';
import { UIActivePreviewItem } from './UIActivePreviewItem';
const { ccclass, property } = _decorator;

@ccclass('UIActivePreviewView')
export default class UIActivePreviewView extends Component {
    @property(ScrollView)
    public scrollView: ScrollView | null = null;

    @property(Button)
    public closeBtn: Button | null = null;

    onLoad() {
        this.closeBtn?.node.on('click', this.close, this);
        const items = this.node.getComponentsInChildren(UIActivePreviewItem);
        items.forEach(item => {
            (item as any).root = this;
        });
    }

    onEnable() {
        MgrToyRace.Instance.initGameState();
        this.scrollView?.scrollToTop(0);
    }

    close() {
        this.node.getComponent(ViewAnimCtrl)?.onClose();
    }
}