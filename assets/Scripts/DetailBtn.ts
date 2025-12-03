import { _decorator, Component, Sprite, cclegacy } from 'cc';
import { MgrUser } from './MgrUser';
import {AvatarCfg} from './AvatarCfg';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('DetailBtn')
export class DetailBtn extends Component {
    @property(Sprite)
    userHead: Sprite | null = null;

    private _userHeadId: number | null = null;

    onLoad() {
        this.node.on('click', this.onDetailBtn, this);
    }

    onEnable() {
        this.showHeadIcon();
    }

    onDisable() {}

    private async showHeadIcon() {
        if (this._userHeadId !== MgrUser.Instance.userData.userHead) {
            this._userHeadId = MgrUser.Instance.userData.userHead;
            if (this.userHead) {
                this.userHead.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(
                    MgrUser.Instance.userData.userHead
                );
            }
        }
    }

    private async onDetailBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailView, {
            root: MgrUi.root(1),
            data: UIPrefabs.TopUI.url
        });
    }
}