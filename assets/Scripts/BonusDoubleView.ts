import { _decorator, Node, Label, Button, tween, v3, Tween, Component } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {Language} from './Language';
import {Toast} from './Toast';
import { AdsManager } from './AdsManager';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('BonusDoubleView')
export class BonusDoubleView extends Component {
    @property(Node)
    lightNode: Node | null = null;

    @property(Label)
    coinTileCount: Label | null = null;

    @property(Label)
    doubleDesc: Label | null = null;

    @property(Button)
    doubleBtn: Button | null = null;

    @property(Button)
    NoBtn: Button | null = null;

    private _coins: number = 0;
    private _onDouble: (() => void) | null = null;

    onLoad() {
        this.doubleBtn!.node.on(Button.EventType.CLICK, this._onDoubleClick, this);
        this.NoBtn!.node.on(Button.EventType.CLICK, this._onNoClick, this);
    }

    reuse(params: { coins: number; onDouble: () => void }) {
        this._coins = params.coins;
        this._onDouble = params.onDouble;
    }

    onEnable() {
        this._startLightAction();
        this.coinTileCount!.string = 'x' + this._coins;
        
        const claimText = Language.Instance.getLangByID('claim');
        const claim2Text = Language.Instance.getLangByID('claim2');
        this.doubleDesc!.string = claimText + ' ' + claim2Text;
        
        this.NoBtn!.node.active = false;
        this.scheduleOnce(() => {
            this.NoBtn!.node.active = true;
        }, 2);
    }

    onDisable() {
        this._onDouble = null;
        this._stopLightAction();
    }

    private _startLightAction() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _stopLightAction() {
        Tween.stopAllByTarget(this.lightNode);
    }

    private _onDoubleClick() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'RewardLevelCoin',
            AdsType: 'RewardLevelCoin',
            onSucceed: () => {
                const doubleCoins = 2 * this._coins;
                const flyData = {
                    sourcePos: this.doubleBtn!.node.worldPosition,
                    itemId: ITEM.TileCoin,
                    change: this._coins,
                    result: doubleCoins,
                    notify: true
                };
                
                MgrUser.Instance.userData.flyAddItem(flyData);
                MgrUser.Instance.userData.addMemItem(ITEM.Coin, doubleCoins, 'RewardLevel');
                
                if (this._onDouble) {
                    this._onDouble();
                }
                this._close();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    private _onNoClick() {
        MgrUser.Instance.userData.addMemItem(ITEM.Coin, this._coins, 'RewardLevel');
        this._close();
    }

    private _close() {
        this.getComponent(ViewAnimCtrl)!.onClose();
    }
}