import { _decorator, Component, Node, Label, Vec3, director, Tween, tween } from 'cc';
import { GlobalEvent } from './Events';
import { AssetPool } from './AssetPool';
import { Utils } from './Utils';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { MgrUi } from './MgrUi';
import { UIPrefabs, IMAGE_ICON_PATH, FlyItemView } from './Prefabs';
import { AssetsCfg } from './AssetsCfg';
import { ITEM } from './GameConst';
import { AppGame } from './AppGame';
import { GoldRankV2Cfg } from './GoldRankV2Cfg';
import { UIIcon } from './UIIcon';
import { pullAt } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GoldTourV2Btn')
export class GoldTourV2Btn extends Component {
    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    rankLabel: Label | null = null;

    @property(Node)
    goldCubeIconNode: Node | null = null;

    private _flyNode: Node[] = [];
    private readonly _tempPos1 = new Vec3();
    private readonly _tempPos2 = new Vec3();
    private readonly _tempPos3 = new Vec3();
    private readonly _tempPos4 = new Vec3();

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
        const timeStr = Utils.timeConvertToHHMM(MgrGoldTournamentV2.Instance.goldTourFinishTimeStampDiff);
        if (this.timeLabel) {
            this.timeLabel.string = timeStr;
        }
    }

    onGoldTourBtn() {
        MgrGoldTournamentV2.Instance.data.tip = true;
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentV2View, {
            root: MgrUi.root(1)
        });
    }

    showGoldCubeFly(count: number) {
        const goldenTileCfg = AssetsCfg.Instance.get(ITEM.GoldenTile);
        const iconPath = IMAGE_ICON_PATH + '/' + goldenTileCfg.icon;
        const flyCount = Math.min(Math.max(3, count), 9);

        this._tempPos1.set(this.goldCubeIconNode!.worldPosition);
        this._tempPos2.set(this.node.worldPosition);
        this._tempPos3.set(this._tempPos2.x, this._tempPos1.y, 0);

        for (let i = 0; i < flyCount; i++) {
            const flyNode = AssetPool.Instance.createObject(FlyItemView.url);
            flyNode.parent = MgrUi.root(2);
            flyNode.setScale(0.9, 0.9, 0.9);
            this._flyNode.push(flyNode);

            flyNode.getComponentInChildren(UIIcon)!.loadSpriteFrame(iconPath);
            flyNode.worldPosition = this._tempPos1;

            Tween.stopAllByTarget(flyNode);
            tween(flyNode)
                .delay(0.1 * i)
                .to(0.64, {
                    worldPosition: this.node.worldPosition
                }, {
                    onUpdate: (target: Node, ratio: number) => {
                        const x = (1 - ratio) * (1 - ratio) * this._tempPos1.x + 
                                2 * ratio * (1 - ratio) * this._tempPos3.x + 
                                ratio * ratio * this._tempPos2.x;
                        const y = (1 - ratio) * (1 - ratio) * this._tempPos1.y + 
                                2 * ratio * (1 - ratio) * this._tempPos3.y + 
                                ratio * ratio * this._tempPos2.y;
                        this._tempPos4.set(x, y, 0);
                        flyNode.worldPosition = this._tempPos4;
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
        const rankData = MgrGoldTournamentV2.Instance.getGoldTourRankIndexData();
        const showCount = GoldRankV2Cfg.Instance.getRankPlayerShowCnt();
        const rank = rankData?.selfData?.rank || showCount + 100;

        if (this.rankLabel) {
            this.rankLabel.string = rank > showCount ? '...' : '' + rank;
        }
    }
}