import { _decorator, Component, Node, Label, Vec3, director, Tween, tween, CCObject } from 'cc';
import { Utils } from './Utils';
import { MgrGoldTournament } from './MgrGoldTournament';
import { AppGame } from './AppGame';
import { UIPrefabs, IMAGE_ICON_PATH, FlyItemView } from './Prefabs';
import { MgrUi } from './MgrUi';
import { ITEM } from './GameConst';
import { GlobalEvent } from './Events';
import { AssetPool } from './AssetPool';
import { AssetsCfg } from './AssetsCfg';
import { GoldRankCfg } from './GoldRankCfg';
import { UIIcon } from './UIIcon';
import {pullAt} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GoldTourBtn')
export class GoldTourBtn extends Component {
    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    rankLabel: Label | null = null;

    @property(Node)
    goldCubeIconNode: Node | null = null;

    private _flyNode: Node[] = [];

    onLoad() {
        this.node.on('click', this.onGoldTourBtn, this);
    }

    onEnable() {
        this.refreshTimeLabel();
        director.on(GlobalEvent.refreshGoldTourTimeStamp, this.refreshTimeLabel, this);
    }

    onDisable() {
        director.targetOff(this);
        this._flyNode.forEach((node) => {
            Tween.stopAllByTarget(node);
            AssetPool.Instance.put(node);
        });
        this._flyNode.length = 0;
    }

    refreshTimeLabel() {
        const timeStr = Utils.timeConvertToHHMM(MgrGoldTournament.Instance.goldTourFinishTimeStampDiff);
        if (this.timeLabel) {
            this.timeLabel.string = timeStr;
        }
    }

    onGoldTourBtn() {
        MgrGoldTournament.Instance.data.tip = true;
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentView, {
            root: MgrUi.root(1)
        });
    }

    showGoldCubeFly(count: number) {
        const startPos = new Vec3();
        const endPos = new Vec3();
        const controlPos = new Vec3();
        const tempPos = new Vec3();

        if (this.goldCubeIconNode) {
            startPos.set(this.goldCubeIconNode.worldPosition);
        }
        endPos.set(this.node.worldPosition);
        controlPos.set(endPos.x, startPos.y, 0);

        const flyCount = Math.min(Math.max(3, count), 9);

        for (let i = 0; i < flyCount; i++) {
            const flyNode = AssetPool.Instance.createObject(FlyItemView.url);
            if (!flyNode) continue;

            flyNode.parent = MgrUi.root(2);
            flyNode.setScale(0.9, 0.9, 0.9);
            this._flyNode.push(flyNode);

            const iconComp = flyNode.getComponentInChildren(UIIcon);
            if (iconComp) {
                const asset = AssetsCfg.Instance.get(ITEM.GoldenTile);
                const iconPath = IMAGE_ICON_PATH + '/' + asset.icon;
                iconComp.loadSpriteFrame(iconPath);
            }

            flyNode.worldPosition = startPos;
            Tween.stopAllByTarget(flyNode);

            tween(flyNode)
                .delay(0.1 * i)
                .to(0.64, {
                    worldPosition: endPos
                }, {
                    onUpdate: (target: Node, ratio: number) => {
                        const x = (1 - ratio) * (1 - ratio) * startPos.x + 
                                2 * ratio * (1 - ratio) * controlPos.x + 
                                ratio * ratio * endPos.x;
                        const y = (1 - ratio) * (1 - ratio) * startPos.y + 
                                2 * ratio * (1 - ratio) * controlPos.y + 
                                ratio * ratio * endPos.y;
                        tempPos.set(x, y, 0);
                        flyNode.worldPosition = tempPos;
                    }
                })
                .call(() => {
                    AssetPool.Instance.put(flyNode);
                    const index = this._flyNode.indexOf(flyNode);
                    if (index >= 0) {
                        pullAt(this._flyNode, [index]);
                    }
                    if (i === flyCount - 1) {
                        AppGame.topUI.goldCubeBtn.hideGoldCube();
                        this.refreshRankIndex();
                    }
                })
                .start();
        }
    }

    refreshRankIndex() {
        const rankData = MgrGoldTournament.Instance.getGoldTourRankIndexData();
        const showCount = GoldRankCfg.Instance.getRankPlayerShowCnt();
        const rank = rankData?.selfData?.rank || showCount + 100;

        if (this.rankLabel) {
            this.rankLabel.string = rank > showCount ? '...' : '' + rank;
        }
    }
}