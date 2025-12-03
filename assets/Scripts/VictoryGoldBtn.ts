import { _decorator, Component, Node, Label, tween, Vec3, Tween, CCInteger } from 'cc';
import { GameConst, ITEM } from './GameConst';
import {Toast} from './Toast';
import {Language} from './Language';
import { MgrGame } from './MgrGame';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { TopUIItem } from './TopUIItem';

const { ccclass, property } = _decorator;

@ccclass('VictoryGoldBtn')
export class VictoryGoldBtn extends Component {
    @property(Node)
    animNode: Node | null = null;

    @property(Label)
    goldLabel: Label | null = null;

    onLoad() {
        if (this.goldLabel) {
            this.goldLabel.string = '+' + GameConst.AdCoinNum;
        }
        this.node.on('click', this.onGoldMovieBtn, this);
    }

    onEnable() {
        this.animEnable();
    }

    onDisable() {
        this.animDisable();
    }

    animEnable() {
        if (!this.animNode) return;
        
        tween(this.animNode)
            .to(0.25, { scale: new Vec3(1.05, 1.1) }, { easing: 'sineInOut' })
            .to(0.25, { scale: Vec3.ONE }, { easing: 'sineInOut' })
            .to(0.25, { scale: new Vec3(1.05, 1.1) }, { easing: 'sineInOut' })
            .to(0.25, { scale: Vec3.ONE }, { easing: 'sineInOut' })
            .delay(2)
            .union()
            .repeatForever()
            .start();
    }

    animDisable() {
        if (!this.animNode) return;
        Tween.stopAllByTarget(this.animNode);
    }

    onGoldMovieBtn() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'GoldMovie',
            AdsType: 'AdEndCoin',
            onSucceed: () => {
                MgrGame.Instance.victoryGold = true;
                MgrUser.Instance.userData.addItem(ITEM.Coin, GameConst.AdCoinNum, {
                    sourcePos: this.node.getWorldPosition(),
                    type: 'AdEndCoin'
                });
                this.node.getComponent(TopUIItem)?.hide();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }
}