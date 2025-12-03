import { _decorator, Component, Node, Vec3, UITransform, director, tween, easing, v3, cclegacy } from 'cc';
import { GameTile } from './GameTile';
import { TileStatus, MAX_ROW, MIN_ROW } from './MgrGame';
import { GamePrefabs } from './Prefabs';
import { TILE_SIZE } from './Const';
import { AssetPool } from './AssetPool';
import {shuffle, values, reduce, each, constant, last, parseInt, times, keys} from 'lodash-es';
import {Tools} from './Tools';
import { AsyncQueue } from './AsyncQueue';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';
import { AppGame } from './AppGame';
import { Utils } from './Utils';
import { MgrAnalytics } from './MgrAnalytics';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('GameMap')
export class GameMap extends Component {
    @property(Node)
    root: Node = null!;

    private _tileList: GameTile[] = [];
    private _lightQueus: AsyncQueue = new AsyncQueue();
    private _originMapPos: Vec3 | null = null;
    private _viewScale: number = 1;

    onLoad() {
        this._originMapPos = new Vec3().set(this.root.position);
    }

    clear() {
        this._tileList.forEach(tile => {
            tile.Recycle();
        });
        this._tileList.length = 0;
        this._lightQueus.clear();
    }

    setMapPos(pos: Vec3) {
        this.root.position = pos;
    }

    addTile(tile: GameTile) {
        this._tileList.push(tile);
    }

    removeTile(tile: GameTile) {
        const index = this._tileList.indexOf(tile);
        if (index >= 0) {
            this._tileList.splice(index, 1);
        }
    }

    get tileList(): GameTile[] {
        return this._tileList;
    }

    get viewScale(): number {
        return this._viewScale;
    }

    set viewScale(value: number) {
        this._viewScale = value;
    }

    calcTileArray(): { [key: number]: GameTile[] } {
        const result: { [key: number]: GameTile[] } = {};
        for (let i = 0; i < this.tileList.length; i++) {
            const tile = this.tileList[i];
            const arr = result[tile.tIdx];
            if (arr) {
                arr.push(tile);
            } else {
                result[tile.tIdx] = [tile];
            }
        }
        return result;
    }

    createTile(pos: Vec3, layer: number, tIdx: number): GameTile {
        const scale = this.viewScale;
        const node = AssetPool.Instance.createObject(GamePrefabs.GameTile.url);
        node.parent = this.root;
        const position = v3(pos.x * TILE_SIZE * scale, pos.y * TILE_SIZE * scale);
        node.position = position;
        node.angle = 0;

        const tile = node.getComponent(GameTile);
        tile.node.name = 'element' + tIdx;
        tile.tIdx = tIdx;
        tile.layer = layer;
        tile.tilePos = pos;
        tile.setViewScale(scale);
        tile.state = TileStatus.Init;
        return tile;
    }

    calcViewAndMapPos(minX: number, maxX: number, minY: number, maxY: number) {
        const widthCount = Math.max(MIN_ROW, Math.ceil(maxX - minX) + 1.2);
        const heightCount = Math.max(MIN_ROW, Math.ceil(maxY - minY) + 1.2);
        
        const uiWidth = this.root.getComponent(UITransform).width / TILE_SIZE;
        const scaleX = Math.max(MAX_ROW, uiWidth) / widthCount;
        
        const uiHeight = this.root.getComponent(UITransform).height / TILE_SIZE;
        const scaleY = Math.max(MAX_ROW, uiHeight) / heightCount;
        
        const scale = Math.min(scaleX, scaleY);
        const offsetY = 0.5 * -(maxY + minY);
        
        const pos = new Vec3().set(this._originMapPos!);
        if (offsetY != 0) {
            pos.y += offsetY * TILE_SIZE * scale;
        }
        this.setMapPos(pos);
        this.viewScale = scale;
    }

    createGoldCube(count: number) {
        let lastType: number | null = null;
        let sameCount = 0;
        let created = 0;
        
        for (let i = this._tileList.length - 1; i >= 0; i--) {
            const tile = this._tileList[i];
            if (tile.tIdx != ITEM.GoldenTile && 
                (lastType == null || lastType == tile.tIdx)) {
                
                lastType = tile.tIdx;
                tile.tIdx = ITEM.GoldenTile;
                
                if (++sameCount == 3) {
                    lastType = null;
                    sameCount = 0;
                }
                
                if (++created >= count) {
                    break;
                }
            }
        }
    }

    createLightGoldCubeFlow(targetCount: number, callback: Function) {
        const self = this;
        const lightCount = MgrUser.Instance.userData.getItem(ITEM.Light);
        const actualCount = targetCount > lightCount ? 3 * Math.floor(lightCount / 3) : targetCount;
        let remaining = actualCount;
        
        const layerTiles: { [layer: number]: { [tIdx: number]: GameTile[] } } = [];
        
        for (let i = 0; i < this._tileList.length; i++) {
            const tile = this._tileList[i];
            if (tile.tIdx != ITEM.GoldenTile) {
                const layerDict = layerTiles[tile.layer] || {};
                const typeArray = layerDict[tile.tIdx] || [];
                typeArray.push(tile);
                layerDict[tile.tIdx] = typeArray;
                layerTiles[tile.layer] = layerDict;
            }
        }
        
        const lastLayerValues = values(last(layerTiles));
        this._lightQueus.clear();
        
        this._lightQueus.push((next: Function) => {
            AppGame.topUI.lightningItem.showLightningItem(lightCount, next);
        });
        
        for (let i = 0; i < lastLayerValues.length; i++) {
            const tiles = lastLayerValues[i];
            if (tiles.length >= 3 && tiles[0].tIdx != ITEM.GoldenTile) {
                const convertCount = Math.min(remaining, 3 * Math.floor(tiles.length / 3));
                remaining -= convertCount;
                
                for (let j = 0; j < convertCount; j++) {
                    const tile = tiles[j];
                    tile.setTIdx(ITEM.GoldenTile);
                    this._lightQueus.push((next: Function) => {
                        tile.playLight();
                        AppGame.topUI.lightningItem.setLightningCount(--lightCount);
                        self.scheduleOnce(next, 0.2);
                    });
                }
            }
        }
        
        if (remaining > 0) {
            let lastType: number | null = null;
            let sameCount = 0;
            let index = this._tileList.length - 1;
            let loopCount = this._tileList.length;
            
            const processTile = (currentLoop: number): boolean => {
                const tile = this._tileList[index];
                if (--index < 0) {
                    index = this._tileList.length - 1;
                }
                
                if (tile.tIdx != ITEM.GoldenTile && 
                    (lastType == null || lastType == tile.tIdx)) {
                    
                    lastType = tile.tIdx;
                    tile.setTIdx(ITEM.GoldenTile);
                    
                    this._lightQueus.push((next: Function) => {
                        tile.playLight();
                        AppGame.topUI.lightningItem.setLightningCount(--lightCount);
                        self.scheduleOnce(next, 0.2);
                    });
                    
                    if (++sameCount == 3) {
                        lastType = null;
                        sameCount = 0;
                        currentLoop = 0;
                        index = this._tileList.length - Utils.randomRange(1, 3);
                    }
                    
                    if (--remaining <= 0) {
                        return true;
                    }
                }
                return false;
            };
            
            for (let i = 0; i < loopCount && !processTile(i); i++) {}
        }
        
        this._lightQueus.push((next: Function) => {
            AppGame.topUI.hideLightningItem();
            next();
        });
        
        this._lightQueus.complete = () => {
            if (remaining > 0) {
                console.error('创建黄金方块失败！！！未创建数量：', remaining);
            }
            
            MgrUser.Instance.userData.subItem(ITEM.Light, actualCount, {
                type: MgrAnalytics.Instance.getCoinUseType(ITEM.Light)
            });
            
            director.emit(GlobalEvent.GameUsePropLight);
            callback();
        };
        
        this._lightQueus.play();
    }

    createAttachs(attachCounts: { [key: string]: number }) {
        const _values = values(attachCounts);
        const total = reduce(_values, (sum: number, count: number) => sum + count, 0);
        const randomTiles = Tools.getRandomArrayElements(this._tileList, total);
        let index = 0;
        
        each(attachCounts, (count: number, idStr: string) => {
            const id = parseInt(idStr);
            for (let i = 0; i < count; i++) {
                const tile = randomTiles[index];
                if (tile) {
                    tile.attachId = id;
                }
                index++;
            }
        });
    }

    buildTree(tiles: GameTile[]) {
        for (let i = 0; i < tiles.length; i++) {
            const current = tiles[i];
            for (let j = tiles.length - 1; j > i; j--) {
                const other = tiles[j];
                if (other.layer == current.layer) {
                    break;
                }
                if (current.isOverlap(other)) {
                    current.addParent(other);
                    other.addChild(current);
                }
            }
        }
    }

    refreshTilesStatus() {
        this._tileList.forEach(tile => {
            tile.state = tile.CollectEnable() ? TileStatus.Light : TileStatus.Gray;
        });
    }

    getMergeTiles(startType: number | null, count: number = 3): GameTile[] {
        let type = startType;
        let found = 0;
        const result: GameTile[] = [];
        
        for (let i = this.tileList.length - 1; i >= 0; i--) {
            const tile = this.tileList[i];
            if ((type == null || type == tile.tIdx)) {
                type = tile.tIdx;
                result.push(tile);
                if (++found == count) {
                    break;
                }
            }
        }
        return result;
    }

    shuffle() {
        let shuffleArray: number[];
        const self = this;
        const completeSets: number[] = [];
        const remaining: { [key: number]: number } = {};
        const lightTiles: GameTile[] = [];
        
        for (let i = 0; i < this.tileList.length; i++) {
            const tile = this.tileList[i];
            remaining[tile.tIdx] = (remaining[tile.tIdx] || 0) + 1;
            if (tile.state == TileStatus.Light) {
                lightTiles.push(tile);
            }
            if (remaining[tile.tIdx] == 3) {
                delete remaining[tile.tIdx];
                completeSets.push(...times(3, constant(tile.tIdx)));
            }
        }
        
        const lightCount = 3 * Math.ceil(lightTiles.length / 3);
        
        if (keys(remaining).length == 0) {
            const firstSet = completeSets.splice(0, 3);
            shuffle(completeSets);
            completeSets.push(...firstSet);
        } else {
            shuffle(completeSets);
            each(remaining, (count: number, typeStr: string) => {
                const type = parseInt(typeStr);
                completeSets.push(...times(count, constant(type)));
            });
        }
        
        const lightArray = completeSets.splice(completeSets.length - lightCount);
        shuffle(lightArray);
        completeSets.push(...lightArray);
        
        for (let i = 0; i < lightTiles.length; i++) {
            const tile = lightTiles[i];
            const newType = completeSets.pop()!;
            const originalPos = v3(tile.node.position);
            const targetPos = v3(tile.node.position).multiplyScalar(1.5);
            
            tween(tile.node)
                .to(0.2, { position: targetPos }, { easing: easing.quadIn })
                .call(() => { tile.tIdx = newType; })
                .to(0.18, { position: originalPos }, { easing: easing.backOut })
                .start();
        }
        
        for (let i = this.tileList.length - 1; i >= 0; i--) {
            const tile = this.tileList[i];
            if (tile.state == TileStatus.Light) {
                continue;
            }
            
            const newType = completeSets.pop()!;
            const originalPos = v3(tile.node.position);
            const targetPos = v3(tile.node.position).multiplyScalar(1.5);
            
            tween(tile.node)
                .to(0.2, { position: targetPos }, { easing: easing.quadIn })
                .call(() => { tile.tIdx = newType; })
                .to(0.18, { position: originalPos }, { easing: easing.backOut })
                .start();
        }
    }
}