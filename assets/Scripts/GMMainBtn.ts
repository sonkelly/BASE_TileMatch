import { _decorator, Component, Button, Node } from 'cc';
import { MgrUi } from './MgrUi';
import { GMViews } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('GMMainBtn')
export class GMMainBtn extends Component {
    @property(Button)
    btnGm: Button | null = null;

    onLoad() {
        if (this.btnGm && this.btnGm.node) {
            this.btnGm.node.on('click', this.onClickGm, this);
        }
    }

    onClickGm() {
        MgrUi.Instance.openViewAsync({
            url: GMViews.GMView.url
        }, {
            priority: 1
        });
    }
}