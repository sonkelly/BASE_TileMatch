import { _decorator, Component, Label, director, cclegacy } from 'cc';
import { ITEM } from './GameConst';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';
import AddCoinLabel from './AddCoinLabel';

const { ccclass, property } = _decorator;

@ccclass('CoinValue')
export class CoinValue extends Component {
    @property(Label)
    coinLabel: Label | null = null;

    private _addCoinLabel: AddCoinLabel | null = null;

    onLoad() {
        this._addCoinLabel = this.coinLabel?.getComponent(AddCoinLabel) || null;
    }

    onEnable() {
        this.freshCoin();
        director.on(GlobalEvent.AssetItemChange + ITEM.Coin, this.freshCoin, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    freshCoin() {
        const coinValue = MgrUser.Instance.userData.getItem(ITEM.Coin);
        if (this._addCoinLabel) {
            this._addCoinLabel.string = coinValue.toString();
        } else if (this.coinLabel) {
            this.coinLabel.string = coinValue.toString();
        }
    }
}