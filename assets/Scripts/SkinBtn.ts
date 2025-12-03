import { _decorator, Component, Node, director, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { MgrSkin } from './MgrSkin';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('SkinBtn')
export class SkinBtn extends Component {
    @property(Node)
    rdDot: Node | null = null;

    onLoad() {
        this.node.on('click', this.onSkinBtn, this);
    }

    onEnable() {
        this.checkRedDot();
        director.on(GlobalEvent.NewSkinViewClose, this.checkRedDot, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    checkRedDot() {
        if (this.rdDot) {
            this.rdDot.active = MgrSkin.Instance.isShowUseTip();
        }
    }

    async onSkinBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.GameSkin, {
            root: MgrUi.root(1)
        });
    }
}