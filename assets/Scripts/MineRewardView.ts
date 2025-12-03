import { _decorator, Component, Node, Button, Label, director } from 'cc';
import { UIPool } from './UIPool';
import { AssetsCfg } from './AssetsCfg';
import { UIIcon } from './UIIcon';
import { ITEM } from './GameConst';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('MineRewardView')
export class MineRewardView extends Component {
    @property(Button)
    receiveBtn: Button | null = null;

    @property(Node)
    contentRoot: Node | null = null;

    @property(UIPool)
    contentPool: UIPool | null = null;

    private _hideCall: (() => void) | null = null;
    private _reward: any[] | null = null;
    private _itemArrays: Node[] = [];

    onLoad() {
        this.receiveBtn!.node.on('click', this._onClickRecieve, this);
    }

    reuse(data: { hideCall?: () => void; reward?: any[] }) {
        if (data) {
            this._hideCall = data.hideCall || null;
            this._reward = data.reward || null;
        }
    }

    onEnable() {
        this._updateItems();
        director.on(GlobalEvent.MinePlayGame, this._onMinePlayGame, this);
    }

    onDisable() {
        director.targetOff(this);
        this._itemArrays.length = 0;
        this.contentPool!.clear();
    }

    private _updateItems() {
        if (!this._reward) return;

        for (let i = 0; i < this._reward.length; i++) {
            const rewardItem = this._reward[i];
            const itemNode = this.contentPool!.get();
            
            itemNode.parent = this.contentRoot;
            this._itemArrays.push(itemNode);

            const uiIcon = itemNode.getComponentInChildren(UIIcon);
            if (uiIcon) {
                uiIcon.icon = AssetsCfg.Instance.get(rewardItem.id).icon;
            }

            const label = itemNode.getComponentInChildren(Label);
            if (label) {
                if (rewardItem.id === ITEM.Energy) {
                    label.string = this._infiniteLifeCount(rewardItem.count);
                } else {
                    label.string = 'x' + rewardItem.count;
                }
            }
        }
    }

    private _infiniteLifeCount(count: number): string {
        const hours = Math.floor(count / 60);
        const minutes = count - 60 * hours;
        return hours ? hours + 'h' + (minutes > 0 ? minutes + 'm' : '') : minutes + 'm';
    }

    private _onClickRecieve() {
        if (!this._reward) return;

        for (let i = 0; i < this._reward.length; i++) {
            const rewardItem = this._reward[i];
            const itemNode = this._itemArrays[i];
            const currentItem = MgrUser.Instance.userData.getItem(rewardItem.id);
            
            MgrUser.Instance.userData.flyAddItem({
                itemId: rewardItem.id,
                change: rewardItem.count,
                result: currentItem,
                sourcePos: itemNode.worldPosition
            });
        }

        if (this._hideCall) {
            this._hideCall();
        }
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private _onMinePlayGame() {
        this._onClickRecieve();
    }
}