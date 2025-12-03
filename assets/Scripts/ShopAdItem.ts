import { _decorator, Component, Sprite, Label, Button, director, isValid } from 'cc';
import { IShopItemCmp } from './IShopItemCmp';
import {AssetsCfg} from './AssetsCfg';
import {ShopCfg} from './ShopCfg';
import {Toast} from './Toast';
import {Language} from './Language';
import { MgrShop } from './MgrShop';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('ShopAdItem')
export class ShopAdItem extends IShopItemCmp {
    @property(Sprite)
    iconSprite: Sprite | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Label)
    descLabel: Label | null = null;

    @property(Button)
    buyBtn: Button | null = null;

    @property(Button)
    contentBtn: Button | null = null;

    @property(Label)
    leftLabel: Label | null = null;

    private _rewardId: number | null = null;
    private _rewardCnt: number | null = null;
    public _cfg: any = null;

    onLoad() {
        this.buyBtn?.node.on(Button.EventType.CLICK, this._onClickBuy, this);
        this.contentBtn?.node.on(Button.EventType.CLICK, this._onClickBuy, this);
    }

    onEnable() {
        if (this.buyBtn) this.buyBtn.interactable = true;
        if (this.contentBtn) this.contentBtn.interactable = true;
    }

    onDisable() {
        director.targetOff(this);
    }

    refreshInfo(cfg: any) {
        this._cfg = cfg;
        const rewardParts = this._cfg.reward.split('|');
        const rewardId = rewardParts[0];
        const rewardCnt = rewardParts[1];
        
        this._rewardId = Number(rewardId);
        this._rewardCnt = Number(rewardCnt);
        
        this._refreshDesc();
        this._refreshPackageIcon();
        this._refreshReward();
        this._refreshLeft();
    }

    private _refreshDesc() {
        if (this.descLabel) {
            this.descLabel.string = this._cfg.desc 
                ? Language.Instance.getLangByID(this._cfg.desc) 
                : '';
        }
    }

    private async _refreshPackageIcon() {
        if (!this.iconSprite) return;
        
        if (this._rewardId === ITEM.Coin) {
            this.iconSprite.spriteFrame = await ShopCfg.Instance.loadPackageIcon(this._cfg.id);
        } else {
            this.iconSprite.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(this._rewardId!);
        }
    }

    private _refreshReward() {
        if (this.countLabel) {
            this.countLabel.string = 'x' + this._rewardCnt;
        }
    }

    private _refreshLeft() {
        if (this.leftLabel) {
            const leftCnt = MgrShop.Instance.getPackageLimitCycleLeftCnt(this._cfg.id);
            this.leftLabel.string = '' + leftCnt;
        }
    }

    private _onClickBuy() {
        if (!this.buyBtn || !this.contentBtn) return;

        this.buyBtn.interactable = false;
        this.contentBtn.interactable = false;

        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'ShopAdItem',
            AdsType: this._getAdType(),
            onSucceed: () => {
                this.buyBtn!.interactable = true;
                this.contentBtn!.interactable = true;
                
                MgrUser.Instance.userData.addItem(
                    this._rewardId!,
                    this._rewardCnt!,
                    {
                        sourcePos: this.iconSprite!.node.getWorldPosition(),
                        type: 'Shop',
                        callback: () => {
                            this._afterGiveReward();
                        }
                    }
                );
                
                MgrShop.Instance.addBuyCnt(this._cfg.id);
            },
            onFail: () => {
                this.buyBtn!.interactable = true;
                this.contentBtn!.interactable = true;
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            },
            onCancel: () => {
                this.buyBtn!.interactable = true;
                this.contentBtn!.interactable = true;
            }
        });
    }

    private _afterGiveReward() {
        if (isValid(this.node)) {
            this._refreshLeft();
            this.delegate?.onShopItemGiveAfter(this);
        }
    }

    private _getAdType(): string {
        switch (this._rewardId) {
            case ITEM.Coin:
                return 'AdShop1';
            case ITEM.Back:
                return 'AdShop2';
            case ITEM.Hint:
                return 'AdShop3';
            case ITEM.Fresh:
                return 'AdShop4';
            default:
                return '';
        }
    }
}