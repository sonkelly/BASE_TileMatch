import { _decorator, Component, Sprite, director, cclegacy } from 'cc';
import { AvatarFrameCfg } from './AvatarFrameCfg';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('CommonAvatarFrame')
export class CommonAvatarFrame extends Component {
    @property(Sprite)
    avatarFrame: Sprite | null = null;

    private isSelf: boolean = true;

    onEnable() {
        director.on(GlobalEvent.unlockHeadFrame, this._refreshFrame, this);
        this._refreshFrame();
    }

    onDisable() {
        this.isSelf = true;
        director.targetOff(this);
    }

    private async _refreshFrame() {
        if (MgrUser.Instance.userData.unlockHeadFrame.length > 0) {
            if (!this.isSelf) {
                this.avatarFrame!.node.active = true;
                return;
            }
            
            this.avatarFrame!.node.active = false;
            const highestLevel = AvatarFrameCfg.Instance.getHightestLvInArray(MgrUser.Instance.userData.unlockHeadFrame);
            this.avatarFrame!.spriteFrame = await AvatarFrameCfg.Instance.loadAvatarFrameSpriteframe(highestLevel);
        } else {
            this.avatarFrame!.node.active = true;
        }
    }

    hide() {
        this.isSelf = false;
        this.avatarFrame!.node.active = false;
    }

    show() {
        this.isSelf = true;
        this._refreshFrame();
    }
}