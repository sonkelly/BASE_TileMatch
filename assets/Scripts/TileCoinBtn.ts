import { _decorator, Component, Label, Node, Vec3, Tween, tween, easing, director, v3, cclegacy } from 'cc';
import { AssetsCfg } from './AssetsCfg';
import { IMAGE_ICON_PATH, FlyItemView } from './Prefabs';
import { ITEM } from './GameConst';
import { AssetPool } from './AssetPool';
import { MgrUi } from './MgrUi';
import { AppGame } from './AppGame';
import { UIAssetFlyView, FlyItem } from './UIAssetFlyView';
import { GlobalEvent } from './Events';
import { UIIcon } from './UIIcon';
import { MgrGame } from './MgrGame';
import { MgrBattleLevel } from './MgrBattleLevel';
import { GameMode } from './Const';
import { pullAt } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('TileCoinBtn')
export class TileCoinBtn extends Component {
    @property(Label)
    coinCount: Label = null!;

    @property(Node)
    iconNode: Node = null!;

    private _flyNode: Node[] = [];

    onDisable() {
        this._flyNode.forEach((node) => {
            Tween.stopAllByTarget(node);
            AssetPool.Instance.put(node);
        });
        this._flyNode.length = 0;
    }

    hide() {
        this.node.active = false;
    }

    showTileCoins(count: number) {
        this.coinCount.string = '' + (count || 0);
        if (!this.node.active) {
            this.node.active = true;
            Tween.stopAllByTarget(this.node);
            const pos = new Vec3(0, 160, 0);
            this.node.position = pos;
            const targetPos = this.getShowPosition();
            tween(this.node)
                .to(0.2, { position: targetPos }, { easing: easing.smooth })
                .start();
        }
    }

    hideTileCoins() {
        if (this.node.active) {
            Tween.stopAllByTarget(this.node);
            const pos = new Vec3(0, 160, 0);
            tween(this.node)
                .to(0.2, { position: pos }, { easing: easing.smooth })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        }
    }

    fixTileCoinsShowPosition() {
        if (this.node.active) {
            tween(this.node)
                .to(0.2, { position: Vec3.ZERO }, { easing: easing.smooth })
                .start();
        }
    }

    setCoinsCount(count: number) {
        this.coinCount.string = '' + count;
    }

    showCoinFly(count: number) {
        const coinCfg = AssetsCfg.Instance.get(ITEM.Coin);
        const iconPath = IMAGE_ICON_PATH + '/' + coinCfg.icon;
        const flyCount = Math.min(Math.max(3, count), 9);
        const targetIcon = UIAssetFlyView.getRegister(FlyItem.Game_Coin).icon;

        const startPos = new Vec3();
        startPos.set(this.iconNode.worldPosition);
        const endPos = new Vec3();
        endPos.set(targetIcon.node.worldPosition);
        const controlPoint = new Vec3();
        controlPoint.set(startPos).lerp(endPos, 0.5);
        controlPoint.y -= 60;

        for (let i = 0; i < flyCount; i++) {
            const flyNode = AssetPool.Instance.createObject(FlyItemView.url);
            flyNode.parent = MgrUi.root(2);
            flyNode.setScale(0.9, 0.9, 0.9);
            this._flyNode.push(flyNode);
            flyNode.getComponentInChildren(UIIcon).loadSpriteFrame(iconPath);
            flyNode.worldPosition = startPos;

            Tween.stopAllByTarget(flyNode);
            tween(flyNode)
                .delay(0.08 * i)
                .to(0.5, { worldPosition: endPos }, {
                    onUpdate: (target: Node, ratio: number) => {
                        const x = (1 - ratio) * (1 - ratio) * startPos.x + 
                                2 * ratio * (1 - ratio) * controlPoint.x + 
                                ratio * ratio * endPos.x;
                        const y = (1 - ratio) * (1 - ratio) * startPos.y + 
                                2 * ratio * (1 - ratio) * controlPoint.y + 
                                ratio * ratio * endPos.y;
                        const tempPos = new Vec3(x, y, 0);
                        flyNode.worldPosition = tempPos;
                    }
                })
                .call(() => {
                    this.playTouchedIcon(targetIcon);
                    AssetPool.Instance.put(flyNode);
                    const index = this._flyNode.indexOf(flyNode);
                    if (index >= 0) {
                        pullAt(this._flyNode, [index]);
                    }
                    if (i === flyCount - 1) {
                        this.hideTileCoins();
                    }
                })
                .start();
        }

        this.scheduleOnce(() => {
            director.emit(GlobalEvent.AssetItemChange + ITEM.Coin, count);
        }, 0.5);
    }

    playTouchedIcon(icon: UIIcon) {
        let originScale = icon.node['__originScale__'];
        if (!originScale) {
            originScale = icon.node['__originScale__'] = v3(icon.node.scale);
        }
        const tempScale = new Vec3();
        tempScale.set(originScale);
        const enlargedScale = new Vec3();
        enlargedScale.set(originScale).multiplyScalar(1.2);

        Tween.stopAllByTag(1000, icon.node);
        tween(icon.node)
            .tag(1000)
            .to(0.04, { scale: enlargedScale })
            .to(0.03, { scale: tempScale })
            .start();
    }

    getShowPosition(): Vec3 {
        const isNotChallenge = AppGame.gameCtrl.currMode !== GameMode.Challenge;
        const currentLevel = MgrGame.Instance.gameData.curLv;
        const isBattleLevel = MgrBattleLevel.Instance.checkIsBattleLevel(currentLevel);
        return isNotChallenge && isBattleLevel ? v3(0, -80, 0) : Vec3.ZERO;
    }
}