import { _decorator, Component, Button, Sprite, SpriteFrame, Node, Label, Color, director } from 'cc';
import {AvatarCfg} from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';
import { AvatarUnlockType } from './Const';
import { MgrGame } from './MgrGame';
import {Toast} from './Toast';
import {Language} from './Language';
import {MgrUi} from './MgrUi';
import {UIPrefabs} from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
const { ccclass, property } = _decorator;

interface IUserAvatarDelegate {
    getChooseHeadId(): number;
    refreshChooseAvatar(id: number): void;
}

@ccclass('UserAvatarItem')
export class UserAvatarItem extends Component {
    @property(Button)
    public chooseBtn: Button | null = null;

    @property(Sprite)
    public bgSp: Sprite | null = null;

    @property(Sprite)
    public avatarSp: Sprite | null = null;

    @property(SpriteFrame)
    public chooseSf: SpriteFrame | null = null;

    @property(SpriteFrame)
    public normalSf: SpriteFrame | null = null;

    @property(SpriteFrame)
    public lockSf: SpriteFrame | null = null;

    @property(Node)
    public unLockNode: Node | null = null;

    @property(Node)
    public costAdNode: Node | null = null;

    @property(Node)
    public costCoinNode: Node | null = null;

    @property(Label)
    public costCoinCount: Label | null = null;

    @property(Node)
    public costLvNode: Node | null = null;

    @property(Label)
    public costLvCount: Label | null = null;

    private _delegate: IUserAvatarDelegate | null = null;
    private _cfg: any = null;

    onLoad() {
        this.chooseBtn?.node.on('click', this._onClickChoose, this);
    }

    onEnable() {
        director.on(GlobalEvent.refreshChooseAvatar, this._refreshChoose, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    private async updateHead(id: number) {
        const sf = await AvatarCfg.Instance.loadHeadSpriteframe(id);
        if (this.avatarSp) this.avatarSp.spriteFrame = sf;
    }

    public init(cfg: any, delegate: IUserAvatarDelegate) {
        this._cfg = cfg;
        this._delegate = delegate;
        this.updateHead(this._cfg.id);
        this._refreshLockState();
        this._refreshChoose();
    }

    private _refreshLockState() {
        const unlocked = AvatarCfg.Instance.isUnlock(this._cfg.id);
        if (this.unLockNode) this.unLockNode.active = !unlocked;
        if (this.avatarSp) this.avatarSp.color = unlocked ? this.avatarSp.color.fromHEX('#FFFFFF') : this.avatarSp.color.fromHEX('#C8C8C8');

        if (!unlocked) {
            const ut = this._cfg.unlockType as AvatarUnlockType;
            this.costAdNode && (this.costAdNode.active = ut === AvatarUnlockType.RewardAd);
            this.costCoinNode && (this.costCoinNode.active = ut === AvatarUnlockType.Coin);
            this.costLvNode && (this.costLvNode.active = ut === AvatarUnlockType.Level);

            if (ut === AvatarUnlockType.Coin && this.costCoinCount) {
                this.costCoinCount.string = '' + this._cfg.unlockNum;
            }
            if (ut === AvatarUnlockType.Level && this.costLvCount) {
                this.costLvCount.string = '' + this._cfg.unlockNum;
            }
        }
    }

    private _refreshChoose() {
        if (!this._delegate || !this.bgSp) return;
        const chosen = this._delegate.getChooseHeadId();
        if (chosen !== this._cfg.id) {
            this.bgSp.spriteFrame = AvatarCfg.Instance.isUnlock(this._cfg.id) ? this.normalSf! : this.lockSf!;
        } else {
            this.bgSp.spriteFrame = this.chooseSf!;
        }
    }

    private async _onClickChoose() {
        if (!this._delegate || this._delegate.getChooseHeadId() === this._cfg.id) return;

        const ut = this._cfg.unlockType as AvatarUnlockType;

        // Default unlock: directly choose
        if (ut === AvatarUnlockType.Default) {
            this._delegate.refreshChooseAvatar(this._cfg.id);
            return;
        }

        // Level unlock: check player level
        if (ut === AvatarUnlockType.Level) {
            if (MgrGame.Instance.gameData.maxLv >= this._cfg.unlockNum) {
                this._delegate.refreshChooseAvatar(this._cfg.id);
            } else {
                Toast.tip(Language.Instance.getLangByID('Level_unlock'));
            }
            return;
        }

        // Coin or RewardAd: need to check if already unlocked, otherwise open alert to unlock
        if (ut === AvatarUnlockType.Coin || ut === AvatarUnlockType.RewardAd) {
            if (MgrUser.Instance.userData.unlockHead.includes(this._cfg.id)) {
                this._delegate.refreshChooseAvatar(this._cfg.id);
            } else {
                if (this.chooseBtn) this.chooseBtn.interactable = false;
                const view = await MgrUi.Instance.openViewAsync(UIPrefabs.UserHeadAlert, {
                    root: MgrUi.root(2),
                    data: this._cfg,
                }) as any;
                view.once(VIEW_ANIM_EVENT.Removed, () => {
                    if (this.chooseBtn) this.chooseBtn.interactable = true;
                });
            }
            return;
        }

        // Fallback: allow choose
        this._delegate.refreshChooseAvatar(this._cfg.id);
    }
}