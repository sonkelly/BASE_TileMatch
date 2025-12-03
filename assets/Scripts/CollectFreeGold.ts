import { _decorator, Component, Button, Label, Sprite, Node } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { GameConst, ITEM } from './GameConst';
import { AdsManager } from './AdsManager';
import { MgrUser } from './MgrUser';
import { Toast } from './Toast';
import { Language } from './Language';

const { ccclass, property } = _decorator;

@ccclass('CollectFreeGold')
export class CollectFreeGold extends Component {
    @property(Button)
    closeBtn: Button | null = null;

    @property(Label)
    coinCount: Label | null = null;

    @property(Sprite)
    coinSp: Sprite | null = null;

    @property(Button)
    adBtn: Button | null = null;

    onLoad() {
        this.closeBtn!.node.on('click', this._onClickClose, this);
        this.adBtn!.node.on('click', this._onClickAd, this);
    }

    onEnable() {
        this.coinCount!.string = '+' + GameConst.Shop_Close_Coin;
    }

    private _onClickClose() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private _onClickAd() {
        const self = this;
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'CollectFreeGold',
            AdsType: 'AdShopCoin',
            onSucceed: () => {
                MgrUser.Instance.userData.addItem(ITEM.Coin, GameConst.Shop_Close_Coin, {
                    sourcePos: self.coinSp!.node.getWorldPosition(),
                    type: 'ShopCoin'
                });
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }
}