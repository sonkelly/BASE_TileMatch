import { _decorator, Component, Button, Node } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { guideMgr } from './GuideManager';

const { ccclass, property } = _decorator;

@ccclass('GameMethodView')
export class GameMethodView extends Component {
    @property(Button)
    closeBtn: Button | null = null;

    onLoad() {
        if (this.closeBtn && this.closeBtn.node) {
            this.closeBtn.node.on('click', this.onClose, this);
        }
    }

    onClose() {
        guideMgr.passGuide();
        const viewAnimCtrl = this.node.getComponent(ViewAnimCtrl);
        if (viewAnimCtrl) {
            viewAnimCtrl.onClose();
        }
    }
}