import { _decorator, Component, Node, Button, Vec3, NodeEventType, isValid } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('RemoveAdTip')
export class RemoveAdTip extends Component {
    @property(Node)
    maskNode: Node | null = null;

    @property(Node)
    zhishiNode: Node | null = null;

    @property(Node)
    tipNode: Node | null = null;

    @property(Button)
    closeBtn: Button | null = null;

    @property(Button)
    shopBtn: Button | null = null;

    private static tempVec3 = new Vec3();

    onLoad() {
        this.maskNode?.on(NodeEventType.TOUCH_END, this._onClickClose, this);
        this.closeBtn?.node.on('click', this._onClickClose, this);
        this.shopBtn?.node.on('click', this._onClickShop, this);
    }

    update(dt: number) {
        if (AppGame.topUI && AppGame.topUI.shopBtn && isValid(AppGame.topUI.shopBtn.node)) {
            RemoveAdTip.tempVec3.set(AppGame.topUI.shopBtn.node.worldPosition);
            this.shopBtn!.node.worldPosition = RemoveAdTip.tempVec3;
            RemoveAdTip.tempVec3.set(RemoveAdTip.tempVec3.x, RemoveAdTip.tempVec3.y - 70, RemoveAdTip.tempVec3.z);
            this.zhishiNode!.worldPosition = RemoveAdTip.tempVec3;
            RemoveAdTip.tempVec3.set(this.tipNode!.worldPosition.x, RemoveAdTip.tempVec3.y - 156, RemoveAdTip.tempVec3.z);
            this.tipNode!.worldPosition = RemoveAdTip.tempVec3;
        }
    }

    private _onClickClose() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }

    private _onClickShop() {
        (async () => {
            this._onClickClose();
            await MgrUi.Instance.openViewAsync(UIPrefabs.ShopView, {
                root: MgrUi.root(1),
                data: {
                    fromUrl: UIPrefabs.RemoveAdTip.url,
                    isScrollToNoAds: true
                }
            });
        })();
    }
}