import { _decorator, Component, Node, director, Tween, tween, v3, Vec3, CCFloat } from 'cc';
import { GlobalEvent } from './Events';
import { MgrPig } from './MgrPig';
import { ITEM } from './GameConst';
import { IMAGE_ICON_PATH, FlyItemView } from './Prefabs';
import {AssetsCfg} from './AssetsCfg';
import { AssetPool } from './AssetPool';
import AddCoinLabel from './AddCoinLabel';
import {UIIcon} from './UIIcon';

const { ccclass, property } = _decorator;

@ccclass('PigBankBtn')
export class PigBankBtn extends Component {
    @property(Node)
    pigNode: Node | null = null;

    @property(Node)
    goldAnimNode: Node | null = null;

    @property(AddCoinLabel)
    pigLabel: AddCoinLabel | null = null;

    start() {
        director.on(GlobalEvent.goldPigRefreshCoin, this.refreshPigCoin, this);
        this.refreshPigCoin();
    }

    onDestroy() {
        director.targetOff(this);
    }

    refreshPigCoin() {
        if (this.pigLabel) {
            this.pigLabel.string = '' + MgrPig.Instance.data.pigCoin;
        }
    }

    pigGoldAnim() {
        const coinAsset = AssetsCfg.Instance.get(ITEM.Coin);
        const iconPath = IMAGE_ICON_PATH + '/' + coinAsset.icon;

        for (let i = 0; i < 5; i++) {
            const coinObj = AssetPool.Instance.createObject(FlyItemView.url);
            const uiIcon = coinObj.getComponentInChildren(UIIcon);
            
            uiIcon.loadSpriteFrame(iconPath);
            coinObj.scale = Vec3.ZERO;
            coinObj.parent = this.goldAnimNode;
            coinObj.setPosition(new Vec3(0, 70, 0));

            tween(coinObj)
                .delay(0.1 * i)
                .set({ scale: new Vec3(0.6, 0.6, 0.6) })
                .to(0.16, { position: Vec3.ZERO })
                .call(() => {
                    this.pigNodeDoAnima();
                })
                .to(0.1, { scale: Vec3.ZERO })
                .call(() => {
                    AssetPool.Instance.put(coinObj);
                    if (i === 0) {
                        this._playCoinLabelAct();
                    }
                })
                .start();
        }
    }

    pigNodeDoAnima() {
        Tween.stopAllByTarget(this.pigNode);
        this.pigNode.scale = v3(0.8, 0.8, 1);
        
        tween(this.pigNode)
            .to(0.1, { scale: v3(0.85, 0.85, 1) })
            .to(0.1, { scale: v3(0.8, 0.8, 1) })
            .start();
    }

    private _playCoinLabelAct() {
        const targetCoin = MgrPig.Instance.data.pigCoin;
        if (this.pigLabel) {
            this.pigLabel.playTo(targetCoin, 0.15);
        }
    }
}