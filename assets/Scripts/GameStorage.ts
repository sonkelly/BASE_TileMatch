import { _decorator, Component, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { cloneDeep } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GameStorage')
export class GameStorage extends Component {
    private _mapPoints: any[] = [];
    private _drity: boolean = false;
    public logic: any = null;

    doDrity(): void {
        console.warn('GameStorage doDrity');
        this._drity = true;
    }

    clear(): void {
        if (this.logic) {
            this.logic.targetOff(this);
        }
        this.logic = null;
        this._mapPoints.length = 0;
        this._drity = false;
    }

    registerGameEvent(logic: any): void {
        this.logic = logic;
        logic.on(GlobalEvent.RestoreComplete, this.onRestoreComplete, this);
        logic.on(GlobalEvent.CreateComplete, this.onCreateComplete, this);
        logic.on(GlobalEvent.GameTileChangeAttach, this.onTileChangeAttach, this);
        logic.on(GlobalEvent.GameTileChangeId, this.onTileChangeId, this);
        logic.on(GlobalEvent.GameTileChangeStatus, this.onTileChangeStatus, this);
    }

    onRestoreComplete(data: any): void {
        this.mapPoints = cloneDeep(data);
    }

    onCreateComplete(): void {
        const tileList = this.logic.map.tileList;
        this._mapPoints.length = 0;
        
        for (let i = 0; i < tileList.length; i++) {
            const tile = tileList[i];
            this._mapPoints.push({
                index: tile.index,
                x: tile.tilePos.x,
                y: tile.tilePos.y,
                tile: tile.tIdx,
                layer: tile.layer,
                status: tile.state,
                attach: tile.attachId
            });
        }
        this.doDrity();
    }

    onTileChangeStatus(data: any): void {
        const point = this._mapPoints[data.index];
        if (point && point.status !== data.state) {
            point.status = data.state;
            this.doDrity();
        }
    }

    onTileChangeId(data: any): void {
        const point = this._mapPoints[data.index];
        if (point && point.tile !== data.tIdx) {
            point.tile = data.tIdx;
            this.doDrity();
        }
    }

    onTileChangeAttach(data: any): void {
        const point = this._mapPoints[data.index];
        if (point && point.attach !== data.attachId) {
            point.attach = data.attachId;
            this.doDrity();
        }
    }

    lateUpdate(dt: number): void {
        if (this._drity) {
            this.save();
            this._drity = false;
        }
    }

    save(): void {
        console.warn('save');
        const collectedIndices: number[] = [];
        
        for (let i = 0; i < this.logic.collector.Collected.length; i++) {
            collectedIndices.push(this.logic.collector.Collected[i].index);
        }
        
        this.logic.saveMap(collectedIndices, this.logic.collector.maxCollectCnt, this._mapPoints);
    }

    get mapPoints(): any[] {
        return this._mapPoints;
    }

    set mapPoints(value: any[]) {
        this._mapPoints = value;
    }
}