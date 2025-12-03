import { _decorator, Component, Label, Layout, director, Node } from 'cc';
import { AppGame } from './AppGame';
import { TileStatus } from './MgrGame';
import { GMStatItem } from './GMStatItem';
import { GlobalEvent } from './Events';
import {keys} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GMStatView')
export class GMStatView extends Component {
    @property(Label)
    totalLabel: Label | null = null;

    @property(Label)
    residueLabel: Label | null = null;

    @property(Label)
    totalGroupLabel: Label | null = null;

    @property(Label)
    residueGroupLabel: Label | null = null;

    @property(Layout)
    layout: Layout | null = null;

    private items: Record<string, GMStatItem> = {};

    onEnable() {
        this.refresh();
        director.on(GlobalEvent.EliminateEvent, this.onEliminateEvent, this);
        director.on(GlobalEvent.ChangeLevel, this.onChangeLevel, this);
    }

    onDisable() {
        this.clear();
        this.items = {};
        director.targetOff(this);
    }

    private onEliminateEvent() {
        this.refresh();
    }

    private onChangeLevel() {
        this.clear();
        this.items = {};
        this.refresh();
    }

    private refresh() {
        const mapPoints = AppGame.gameCtrl.storage.mapPoints;
        if (mapPoints) {
            this.calcInfo(mapPoints);
        } else {
            if (this.totalLabel) this.totalLabel.string = '0';
            if (this.residueLabel) this.residueLabel.string = '0';
            if (this.totalGroupLabel) this.totalGroupLabel.string = '0';
            if (this.residueGroupLabel) this.residueGroupLabel.string = '0';
        }
    }

    private calcInfo(mapPoints: any[]) {
        if (this.totalLabel) this.totalLabel.string = mapPoints.length.toString();
        if (this.totalGroupLabel) this.totalGroupLabel.string = (mapPoints.length / 3).toString();

        const totalCount: Record<string, number> = {};
        const residueCount: Record<string, number> = {};
        let residueTotal = 0;

        for (const point of mapPoints) {
            totalCount[point.tile] = (totalCount[point.tile] || 0) + 1;
            
            if (point.status < TileStatus.Remove) {
                residueTotal++;
                residueCount[point.tile] = (residueCount[point.tile] || 0) + 1;
            }
        }

        if (this.residueLabel) this.residueLabel.string = residueTotal.toString();
        if (this.residueGroupLabel) this.residueGroupLabel.string = (residueTotal / 3).toString();

        const tileKeys = keys(totalCount);
        for (const tileKey of tileKeys) {
            let item = this.items[tileKey];
            if (!item) {
                const node = this.get();
                if (node && this.layout?.node) {
                    node.parent = this.layout.node;
                    item = node.getComponent(GMStatItem);
                    if (item) {
                        this.items[tileKey] = item;
                        item.setIcon(tileKey);
                    }
                }
            }

            if (item) {
                item.setTotal((totalCount[tileKey] || 0) / 3);
                item.setResidue((residueCount[tileKey] || 0) / 3);
            }
        }
    }

    private clear() {
        // Clear implementation
    }

    private get(): Node | null {
        // Get node from pool implementation
        return null;
    }
}