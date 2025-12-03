import { _decorator, Component, Button, Node, Sprite, Label, director, tween, v3, Tween } from 'cc';
import { AvatarUnlockType } from './Const';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AvatarCfg } from './AvatarCfg';
import { ITEM } from './GameConst';
import { MgrUser } from './MgrUser';
import { Language } from './Language';
import { Toast } from './Toast';
import { AdsManager } from './AdsManager';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('UserHeadAlert')
export class UserHeadAlert extends Component {
    @property(Button)
    closeBtn: Button | null = null;

    @property(Button)
    cancelBtn: Button | null = null;

    @property(Button)
    sureBtn: Button | null = null;

    @property(Node)
    lightNode: Node | null = null;

    @property(Sprite)
    avatarSp: Sprite | null = null;

    @property(Node)
    costAdNode: Node | null = null;

    @property(Node)
    costCoinNode: Node | null = null;

    @property(Label)
    costCoinCount: Label | null = null;

    @property(Label)
    goldLabel: Label | null = null;

    private _cfg: any = null;

    onLoad() {
        this.closeBtn?.node.on('click', this._clickCloseBtn, this);
        this.cancelBtn?.node.on('click', this._clickCloseBtn, this);
        this.sureBtn?.node.on('click', this._clickSureBtn, this);
    }

    reuse(cfg: any) {
        this._cfg = cfg;
    }

    onEnable() {
        director.on(GlobalEvent.AssetItemChange + ITEM.Coin, this._freshCoin, this);
        
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
            
        this._refreshInfos();
        this._freshCoin();
    }

    onDisable() {
        Tween.stopAllByTarget(this.lightNode);
        director.targetOff(this);
    }

    private _freshCoin() {
        if (this.goldLabel) {
            this.goldLabel.string = '' + MgrUser.Instance.userData.getItem(ITEM.Coin);
        }
    }

    private async _refreshInfos() {
        if (this.costAdNode && this.costCoinNode && this.costCoinCount) {
            this.costAdNode.active = this._cfg.unlockType == AvatarUnlockType.RewardAd;
            this.costCoinNode.active = this._cfg.unlockType == AvatarUnlockType.Coin;
            this.costCoinCount.string = this._cfg.unlockType == AvatarUnlockType.Coin ? '' + this._cfg.unlockNum : '';
            
            if (this.avatarSp) {
                this.avatarSp.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(this._cfg.id);
            }
        }
    }

    private _clickCloseBtn() {
        this.node.getComponent(ViewAnimCtrl)?.onClose();
    }

    private _clickSureBtn() {
        if (this._cfg.unlockType == AvatarUnlockType.Coin) {
            if (MgrUser.Instance.userData.judgeItem(ITEM.Coin, this._cfg.unlockNum)) {
                MgrUser.Instance.userData.subItem(ITEM.Coin, this._cfg.unlockNum, { type: 'BuyAvatar' });
                this._unlockHead();
            } else {
                Toast.tip(Language.Instance.getLangByID('not_enough_gold'));
            }
        } else if (this._cfg.unlockType == AvatarUnlockType.RewardAd) {
            AdsManager.getInstance().showRewardedVideo({
                OpenUi: 'UserHeadAlert',
                AdsType: 'AdUnlockAvatar',
                onSucceed: () => {
                    this._unlockHead();
                },
                onFail: () => {
                    Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
                }
            });
        }
    }

    private _unlockHead() {
        MgrUser.Instance.userData.addUnlockHead(this._cfg.id);
        director.emit(GlobalEvent.unlockAvatar, this._cfg.id);
        this._clickCloseBtn();
        Toast.tip(Language.Instance.getLangByID('unlock_tip'));
    }
}