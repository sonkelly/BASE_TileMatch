import { _decorator, Component, Node, director, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { MgrRank } from './MgrRank';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('RankBtn')
export class RankBtn extends Component {
    @property(Node)
    rdDot: Node | null = null;

    onLoad() {
        this.node.on('click', this.onRankBtn, this);
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
            this.rdDot.active = !MgrRank.Instance.rankData.used;
        }
    }

    async onRankBtn() {
        MgrRank.Instance.rankData.used = true;
        await MgrUi.Instance.openViewAsync(UIPrefabs.RankView, {
            root: MgrUi.root(1)
        });
    }
}