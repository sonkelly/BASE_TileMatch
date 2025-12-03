import { _decorator, Component, Sprite, SpriteFrame, director } from 'cc';
import { GlobalEvent } from './Events';
import {MgrUser} from './MgrUser';
import {AvatarFrame2Cfg} from './AvatarFrame2Cfg';

const { ccclass, property } = _decorator;

@ccclass('CommonAvatarFrame2')
export class CommonAvatarFrame2 extends Component {
    @property(Sprite)
    public avatarFrame: Sprite | null = null;

    private isSelf: boolean = true;

    onEnable() {
        director.on(GlobalEvent.unlockHeadFrameV2, this._refreshFrame, this);
        this._refreshFrame();
    }

    onDisable() {
        this.isSelf = true;
        director.targetOff(this);
    }

    private async _refreshFrame(): Promise<void> {
        const userData: any = MgrUser.Instance.userData;
        const unlocked = userData && Array.isArray(userData.unlockHeadFrame2) ? userData.unlockHeadFrame2 : [];

        if (unlocked.length > 0) {
            if (!this.isSelf) {
                if (this.avatarFrame) this.avatarFrame.node.active = false;
                return;
            }
            if (this.avatarFrame) this.avatarFrame.node.active = true;

            const highest = AvatarFrame2Cfg.Instance.getHightestLvInArray(unlocked);
            const spriteFrame: SpriteFrame | null = await AvatarFrame2Cfg.Instance.getAvatarFrameSpriteframe(highest);

            if (this.avatarFrame) this.avatarFrame.spriteFrame = spriteFrame;
        } else {
            if (this.avatarFrame) this.avatarFrame.node.active = false;
        }
    }

    hide() {
        this.isSelf = false;
        if (this.avatarFrame) this.avatarFrame.node.active = false;
    }

    show() {
        this.isSelf = true;
        this._refreshFrame();
    }
}