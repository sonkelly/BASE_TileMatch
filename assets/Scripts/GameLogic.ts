import { _decorator, cclegacy, director, sp, Vec3, UITransform, Component, Node } from 'cc';
import { VIBRATE_ONESHOT, GUIDE_PROP_BONUS_WAND, GameMode, TASK_TYPE, LevelMode} from './Const';
import { ITEM as ITEM_CONST, GameConst as GAME_CONST} from './GameConst';
import { GlobalEvent } from './Events';
import { AppGame } from './AppGame';
import { IEmitter } from './IEmitter';
import { MgrGame, TileStatus, MAX_COLLECTED, GameStatus } from './MgrGame';
import { config } from './Config';
import { AsyncQueue } from './AsyncQueue';
import { TILE_EVENT as TILE_EVENT_CONST } from './GameTile';
import { MgrMonthTile } from './MgrMonthTile';
import { GameConst } from './GameConst';
import { MgrUser } from './MgrUser';
import { NativeBridge } from './NativeBridge';
import {AudioPlayer} from './AudioPlayer';
import { GameAudios, GamePrefabs, UIPrefabs } from './Prefabs';
import { MgrTask } from './MgrTask';
import { MgrAnalytics } from './MgrAnalytics';
import {MgrUi} from './MgrUi';
import { AssetPool } from './AssetPool';
import { MgrBonusWand } from './MgrBonusWand';
import { MgrMine } from './MgrMine';
import { MgrBattleLevel } from './MgrBattleLevel';
import {get, set, find, isEmpty, each, cloneDeep, keys as ldKeys, difference, last as ldLast} from 'lodash-es';

const { ccclass, property } = _decorator;

export enum LogicStatus {
    None = 0,
    Enter = 1,
    Idle = 2,
    Collect = 3,
    Guide = 4,
    Undo = 5,
    Wand = 6,
    Shuffle = 7,
    Auto = 8,
    Victory = 9,
    Fail = 10,
    Revive = 11,
    Exit = 12,
}

const SAMPLE_KEYS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

@ccclass('GameLogic')
export class GameLogic extends IEmitter {
    private _status: LogicStatus = LogicStatus.None;
    public delegate: any = null;
    public levelMode: LevelMode = LevelMode.Clear;
    private _collectGoldCube: number = 0;
    private _collectedAttachs: Record<string, number> = {};
    private _taskQueus: AsyncQueue = new AsyncQueue();
    private _undoTiles: any[] = [];
    private _shuffleEff: Node | null = null;
    private _beDelShuffle: boolean = true;

    // ---------- lifecycle / overrides (can be extended) ----------
    protected onStartup?(): void;
    protected onBeforeRestore?(data: any): void;
    protected onAfterRestore?(): void;
    protected onAfterCreate?(): void;
    protected createBuildAfterToFlows?(q: AsyncQueue): void;
    protected createBattleLevelVsToFlows?(q: AsyncQueue): void;
    protected restoreExtraToFlows?(q: AsyncQueue): void;
    protected createExtraToFlows?(q: AsyncQueue): void;
    protected onExit?(): void;
    protected onVictory?(data: any): void;
    protected onFailed?(err?: any): void;
    protected onReplay?(): void;
    protected onRevive?(data?: any): void;

    isSupportWand(): boolean {
        return true;
    }

    setAttachCount(id: number | string, cnt: number) {
        this._collectedAttachs[id] = cnt;
        this.storage.doDrity && this.storage.doDrity();
    }

    addAttachCount(id: number | string, delta: number) {
        const v = (this._collectedAttachs[id] || 0) + delta;
        this._collectedAttachs[id] = v;
        this.storage.doDrity && this.storage.doDrity();
        return v;
    }

    clear() {
        this.unscheduleAllCallbacks && this.unscheduleAllCallbacks();
        this.collector && this.collector.clear && this.collector.clear();
        this.map && this.map.clear && this.map.clear();
        this._collectGoldCube = 0;
        this._collectedAttachs = {};
        this._taskQueus && this._taskQueus.clear && this._taskQueus.clear();
        this.removeShuffleEff();
    }

    createLevel(cfg: { layerCfg: any[], elementCnt: number, algorithm: any, algorithmParam: any }) {
        const { layerCfg, elementCnt, algorithm, algorithmParam } = cfg;
        const elements = GameConst.sampleSize ? GameConst.sampleSize(SAMPLE_KEYS, elementCnt) : GAME_CONST.sampleSize ? GAME_CONST.sampleSize(SAMPLE_KEYS, elementCnt) : SAMPLE_KEYS.slice(0, elementCnt);
        const layersPoints: any[] = [];
        const iconsPool: any[] = [];
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        let tempCounter = 0;
        let popCycle = 3;
        // create icons array per cell
        const iconLayers: any[] = [];
        for (let li = 0; li < layerCfg.length; li++) {
            const layer = layerCfg[li];
            const pts: any[] = [];
            const icons: any[] = [];
            for (let ci = 0; ci < layer.length; ci++) {
                const p = layer[ci];
                const x = p.x;
                const y = -p.y;
                pts.push({ x, y });
                minX = Math.min(x, minX);
                maxX = Math.max(x, maxX);
                minY = Math.min(y, minY);
                maxY = Math.max(y, maxY);
                if (popCycle === 3) {
                    popCycle = 1;
                    tempCounter = (tempCounter + 1) % elementCnt;
                } else {
                    popCycle++;
                }
                const el = elements[tempCounter];
                icons.push(el);
            }
            iconLayers.push(icons);
            pts.sort((a,b) => {
                const dy = b.y - a.y;
                return dy === 0 ? a.x - b.x : dy;
            });
            layersPoints.push(pts);
        }

        return {
            icons: MgrGame.Instance.calcAlgorithmIcons ? MgrGame.Instance.calcAlgorithmIcons(iconLayers, algorithm, algorithmParam) : iconLayers,
            layerPoints: layersPoints,
            maxX,
            minX,
            maxY,
            minY,
            elements,
        };
    }

    async enter(cb?: Function) {
        this.logicStatus = LogicStatus.Enter;
        const level = this.getCurrLevel();
        let storageData = this.getStorageData(level);
        if (storageData) {
            if (storageData.collected && storageData.points && find(storageData.points, (p:any)=>p.status < TileStatus.Collect)) {
                // keep
            } else {
                storageData = null;
            }
        }

        this.initEnvironment();

        if (storageData && storageData.points && storageData.points.length > 0) {
            this.onBeforeRestore(storageData);
            this.restore(storageData, cb);
        } else {
            const layerCfg = await this.loadLevelCfg(level);
            const algInfo = this.getAlgorithm(level);
            const algorithm = algInfo.algorithm;
            const algorithmParam = algInfo.algorithmParam;
            const newLevelCfg = {
                layerCfg,
                elementCnt: this.getElementCnt(level),
                algorithm,
                algorithmParam,
            };
            this.createNew(newLevelCfg, cb);
        }
    }

    exit() {
        this.logicStatus = LogicStatus.Exit;
        this.onExit && this.onExit();
    }

    initEnvironment() {
        this.storage.registerGameEvent && this.storage.registerGameEvent(this);
    }

    createTile(point: any, layerIdx: number, tileId: number) {
        const t = this.map.createTile(point, layerIdx, tileId);
        t.delegate = this;
        t.on && t.on(TILE_EVENT_CONST.Click, this.onClickTile, this);
        t.on && t.on(TILE_EVENT_CONST.ChangeAttach, this.onTileChangeAttachEvent, this);
        t.on && t.on(TILE_EVENT_CONST.ChangeTileId, this.onTileChangeId, this);
        t.on && t.on(TILE_EVENT_CONST.ChangeStatus, this.onTileChangeStatus, this);
        return t;
    }

    onClickTile(tile: any) {
        if (NativeBridge.Instance.vibrate) NativeBridge.Instance.vibrate(VIBRATE_ONESHOT);
        if (!(tile.state > TileStatus.Light)) {
            if (tile.CollectEnable && tile.CollectEnable()) {
                if (this.logicStatus === LogicStatus.Idle || this.logicStatus == LogicStatus.Collect) {
                    if (this.collector.isFull) {
                        tile.playPutdown && tile.playPutdown();
                    } else {
                        if (this.collector.collect(tile)) {
                            const prop = MgrGame.Instance.getPropGuide && MgrGame.Instance.getPropGuide(ITEM_CONST.Back);
                            if (prop) {
                                this.logicStatus = LogicStatus.Guide;
                                this.scheduleOnce && this.scheduleOnce(()=> {
                                    prop && this.option.guide && this.option.guide(ITEM_CONST.Back, prop);
                                }, 0.25);
                            } else {
                                this.logicStatus = LogicStatus.Collect;
                            }
                        } else {
                            tile.playPutdown && tile.playPutdown();
                        }
                        AudioPlayer.Instance && AudioPlayer.Instance.playEffect && AudioPlayer.Instance.playEffect(GameAudios.Move.url);
                        this.option && this.option.refreshStatusUndo && this.option.refreshStatusUndo();
                    }
                } else {
                    tile.playPutdown && tile.playPutdown();
                }
            } else {
                tile.playShake && tile.playShake();
            }
        }
    }

    onTileChangeAttachEvent(e: any) {
        this.emit(GlobalEvent.GameTileChangeAttach, e);
    }

    onTileChangeId(e: any) {
        this.emit(GlobalEvent.GameTileChangeId, e);
    }

    onTileChangeStatus(e: any) {
        this.emit(GlobalEvent.GameTileChangeStatus, e);
    }

    processStorageLevelData(data: any) {
        const collectedIdxs: number[] = data.collected || [];
        const collectPoolCnt = data.collectPoolCnt || 0;
        const points = data.points || [];
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        let removeCnt = 0;
        const layers: any[] = [];
        const collectedTiles: any[] = [];
        const tileMap: Record<string, any[]> = {};
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            minX = Math.min(p.x, minX);
            maxX = Math.max(p.x, maxX);
            minY = Math.min(p.y, minY);
            maxY = Math.max(p.y, maxY);
            if (p.status != TileStatus.Remove) {
                if (p.status == TileStatus.Collect) {
                    const arr = get(tileMap, p.tile, []);
                    if (arr.length === 2) {
                        // remove previous entries
                        for (let j = arr.length - 1; j >= 0; j--) {
                            const t = arr[j];
                            const layerArr = get(layers, t.layer, []);
                            const idx = layerArr.indexOf(t);
                            if (idx >= 0) layerArr.splice(idx, 1);
                            const gi = collectedTiles.indexOf(t);
                            if (gi >= 0) collectedTiles.splice(gi, 1);
                            const ci = collectedIdxs.indexOf(t.index);
                            if (ci >= 0) collectedIdxs.splice(ci, 1);
                        }
                        arr.length = 0;
                        continue;
                    }
                    if (collectedTiles.length < collectPoolCnt - 1) {
                        collectedTiles.push(p);
                        arr.push(p);
                        if (collectedIdxs.indexOf(p.index) < 0) collectedIdxs.push(p.index);
                        set(tileMap, p.tile, arr);
                    } else {
                        p.status = TileStatus.Init;
                        const idx = collectedIdxs.indexOf(p.index);
                        if (idx >= 0) collectedIdxs.splice(idx, 1);
                    }
                }
                const layerArr = get(layers, p.layer, []);
                layerArr.push(p);
                set(layers, p.layer, layerArr);
            } else {
                removeCnt++;
            }
        }

        return {
            minX,
            maxX,
            minY,
            maxY,
            layers,
            removeCnt,
        };
    }

    onBeforeRestore(data: any) {
        const pts = data.points;
        const attachs = data.attachs || {};
        const mineOpen = MgrMine.Instance.isOpen();
        const mineFinish = MgrMine.Instance.isFinish();
        if (!(mineOpen && !mineFinish)) {
            attachs[ITEM_CONST.PickAxe] = 0;
            pts.forEach((p:any) => {
                if (p.attach == ITEM_CONST.PickAxe) p.attach = -1;
            });
        }
    }

    restore(data: any, cb?: Function) {
        if (!data) {
            cb && cb();
            return;
        }
        const collectedIdxs = data.collected || [];
        const collectPoolCnt = data.collectPoolCnt || 0;
        const goldCube = data.goldCube || 0;
        const points = data.points || [];
        const attachs = data.attachs || {};
        if (config.debug) {
            console.error('collectedIdxs: ', JSON.stringify(collectedIdxs));
            console.error('collectPoolCnt: ', collectPoolCnt);
            console.error('points: ', JSON.stringify(points));
            console.error('goldCube: ', goldCube);
            console.error('attachs: ', attachs);
        }

        this.collector.maxCollectCnt = collectPoolCnt;
        this._collectGoldCube = goldCube;
        this._collectedAttachs = attachs || {};

        const processed = this.processStorageLevelData(data);
        const minX = processed.minX;
        const maxX = processed.maxX;
        const minY = processed.minY;
        const maxY = processed.maxY;
        const layers = processed.layers;
        const removeCnt = processed.removeCnt;

        this.map.calcViewAndMapPos && this.map.calcViewAndMapPos(minX, maxX, minY, maxY);
        MgrGame.Instance.wisdom = Math.floor(removeCnt / 3);
        this._taskQueus.clear && this._taskQueus.clear();

        let prevTile: any = null;
        const createdTiles: any[] = [];
        const restoreMap: Record<number, any> = {};

        for (let li = 0; li < layers.length; li++) {
            ((layerIndex: number) => {
                const list = layers[layerIndex];
                if (list && list.length > 0) {
                    this._taskQueus.push((done: Function) => {
                        list.forEach((info: any) => {
                            const tile = this.createTile(info, layerIndex, info.tile);
                            if (prevTile) prevTile.next = tile;
                            tile.pre = prevTile;
                            prevTile = tile;
                            tile.index = info.index;
                            if (info.status == TileStatus.Collect) {
                                tile.node.scale = Vec3.ZERO;
                                restoreMap[info.index] = tile;
                                tile.attachId = -1;
                            } else {
                                tile.attachId = info.attach;
                                tile.playEnter && tile.playEnter();
                                this.map.addTile && this.map.addTile(tile);
                            }
                            createdTiles.push(tile);
                        });
                        AudioPlayer.Instance && AudioPlayer.Instance.playEffect && AudioPlayer.Instance.playEffect(GameAudios.TilePop.url);
                        this.scheduleOnce && this.scheduleOnce(done, 0.08);
                    });
                }
            })(li);
        }

        // build tree & restore collector
        this._taskQueus.push((done: Function) => {
            this.map.buildTree && this.map.buildTree(createdTiles);
            done();
        });

        this._taskQueus.push((done: Function) => {
            const restoreArr: any[] = [];
            for (let i = 0; i < collectedIdxs.length; i++) {
                const id = collectedIdxs[i];
                const t = restoreMap[id];
                if (t) restoreArr.push(t);
                else console.error('restore failed:', i, id);
            }
            this.collector.restore && this.collector.restore(restoreArr, collectPoolCnt);
            this.scheduleOnce && this.scheduleOnce(done, 0.08);
        });

        // allow subclass/extension to add extra flows
        this.restoreExtraToFlows && this.restoreExtraToFlows(this._taskQueus);

        this._taskQueus.push((done: Function) => {
            this.map.refreshTilesStatus && this.map.refreshTilesStatus();
            this.option.refreshStatus && this.option.refreshStatus();
            done();
        });

        this.option.setWandSuper && this.option.setWandSuper(this.isSupportWand() && MgrBonusWand.Instance.activeBonus);

        this._taskQueus.complete = () => {
            this.logicStatus = LogicStatus.Idle;
            this.onAfterRestore && this.onAfterRestore();
            this.emit(GlobalEvent.RestoreComplete, data.points);
            director.emit && director.emit(GlobalEvent.RestoreComplete);
            cb && cb();
        };

        this._taskQueus.play && this._taskQueus.play();
    }

    createNew(cfg: any, cb?: Function) {
        const levelInfo = this.createLevel(cfg);
        const icons = levelInfo.icons;
        const layerPoints = levelInfo.layerPoints;
        const maxX = levelInfo.maxX;
        const minX = levelInfo.minX;
        const maxY = levelInfo.maxY;
        const minY = levelInfo.minY;
        const elements = levelInfo.elements;
        const attachInfo = this.getAttachInfo && this.getAttachInfo();
        this.collector.maxCollectCnt = MAX_COLLECTED;
        const level = this.getCurrLevel();

        MgrMonthTile.Instance.checkMonthTile && MgrMonthTile.Instance.checkMonthTile(level, elements);
        this.map.calcViewAndMapPos && this.map.calcViewAndMapPos(minX, maxX, minY, maxY);
        this._taskQueus.clear && this._taskQueus.clear();

        this.createLayerTilesToFLow(layerPoints, icons, this._taskQueus);
        this.createAttachsToFlows(attachInfo, this._taskQueus);
        this.createExtraToFlows && this.createExtraToFlows(this._taskQueus);

        this._taskQueus.push((done: Function) => {
            this.map.buildTree && this.map.buildTree(this.map.tileList);
            this.map.refreshTilesStatus && this.map.refreshTilesStatus();
            this.option.refreshStatus && this.option.refreshStatus();
            this.scheduleOnce && this.scheduleOnce(done, 0.5);
        });

        this.createBuildAfterToFlows && this.createBuildAfterToFlows(this._taskQueus);
        this.createBattleLevelVsToFlows && this.createBattleLevelVsToFlows(this._taskQueus);

        if (this.isSupportWand()) {
            const prevStatus = MgrBonusWand.Instance.status;
            MgrBonusWand.Instance.handleStatus && MgrBonusWand.Instance.handleStatus();
            if (prevStatus == MgrBonusWand.Instance.status) {
                this.option.setWandSuper && this.option.setWandSuper(MgrBonusWand.Instance.activeBonus);
            } else {
                if (MgrBonusWand.Instance.activeBonus) {
                    this._taskQueus.push((done: Function) => {
                        this.option.playWandSuper && this.option.playWandSuper(() => {
                            if (!MgrBonusWand.Instance.giftProp) {
                                MgrBonusWand.Instance.giftProp = true;
                                MgrUser.Instance.userData.addItem && MgrUser.Instance.userData.addItem(ITEM_CONST.Hint, 1);
                                this.option.guide && this.option.guide(ITEM_CONST.Hint, { guideId: prevStatus, desc: 'super_hint_tip3' });
                            }
                            done();
                        });
                    });
                }
            }
        } else {
            this.option.setWandSuper && this.option.setWandSuper(false);
        }

        this._taskQueus.complete = () => {
            this.logicStatus = LogicStatus.Idle;
            this.onAfterCreate && this.onAfterCreate();
            this.emit(GlobalEvent.CreateComplete);
            director.emit && director.emit(GlobalEvent.CreateComplete);
            cb && cb();
        };

        this._taskQueus.play && this._taskQueus.play();
    }

    createLayerTilesToFLow(layerPoints: any[], icons: any[], queue: AsyncQueue) {
        let idx = 0;
        let tIdx = 0;
        let prev: any = null;
        for (let li = 0; li < layerPoints.length; li++) {
            ((layerIndex: number) => {
                const pts = layerPoints[layerIndex];
                queue.push((done: Function) => {
                    pts.forEach((pt: any) => {
                        const tile = this.createTile(pt, layerIndex, icons[tIdx++]);
                        if (prev) prev.next = tile;
                        tile.pre = prev;
                        prev = tile;
                        tile.index = idx++;
                        tile.attachId = -1;
                        tile.playEnter && tile.playEnter();
                        this.map.addTile && this.map.addTile(tile);
                    });
                    AudioPlayer.Instance && AudioPlayer.Instance.playEffect && AudioPlayer.Instance.playEffect(GameAudios.TilePop.url);
                    this.scheduleOnce && this.scheduleOnce(done, 0.08);
                });
            })(li);
        }
    }

    createAttachsToFlows(attachInfo: any, queue: AsyncQueue) {
        if (attachInfo && !isEmpty(attachInfo)) {
            queue.push((done: Function) => {
                this.map.createAttachs && this.map.createAttachs(attachInfo);
                done();
            });
        }
    }

    createLightGoldCubeToFlow(isTournament: boolean, queue: AsyncQueue) {
        if (MgrUser.Instance.userData.getItem && MgrUser.Instance.userData.getItem(ITEM_CONST.Light) >= 3) {
            const add = isTournament ? GAME_CONST.GOLDTOURNAMENT_GOLDTILE_NUM : 0;
            const num = GAME_CONST.GOLDTILE_LEVEL_MAX_NUM - add;
            queue.push((done: Function) => {
                this.map.createLightGoldCubeFlow && this.map.createLightGoldCubeFlow(num, done);
            });
        }
        queue.push((done: Function) => {
            if (this.delegate && this.delegate.isGoldTourOpen) {
                const tiles = (AppGame && AppGame.gameCtrl && AppGame.gameCtrl.gameMap ? AppGame.gameCtrl.gameMap.tileList : []) || [];
                let exist = false;
                for (let i = 0; i < tiles.length; i++) {
                    if (tiles[i].tIdx == ITEM_CONST.GoldenTile) { exist = true; break; }
                }
                if (exist || this._collectGoldCube > 0) {
                    AppGame.topUI.goldCubeBtn.showGoldCube && AppGame.topUI.goldCubeBtn.showGoldCube(this.collectGoldCube);
                }
            }
            done();
        });
    }

    createBattleLevelVsToFlows(queue: AsyncQueue) {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = this.getCurrLevel();
            if (MgrBattleLevel.Instance.checkIsBattleLevel && MgrBattleLevel.Instance.checkIsBattleLevel(level)) {
                queue.push((done: (()=>void)) => {
                    MgrBattleLevel.Instance.addToCreateFlows && MgrBattleLevel.Instance.addToCreateFlows(done);
                });
            }
        }
    }

    startup() {
        this.onStartup && this.onStartup();
        this.emit(GlobalEvent.GameStartup);
        director.emit && director.emit(GlobalEvent.GameStartup);
    }

    onGuideComplete() {
        this.logicStatus = LogicStatus.Idle;
    }

    undo() {
        if (this.logicStatus != LogicStatus.Undo && this.logicStatus !== LogicStatus.Idle && this.logicStatus !== LogicStatus.Guide) {
            return false;
        }
        const tile = this.collector.undo && this.collector.undo(this.map.root);
        if (!tile) return false;
        this.logicStatus = LogicStatus.Undo;
        this._undoTiles.push(tile);
        this.map.addTile && this.map.addTile(tile);
        const self = this;
        tile.playUndo && tile.playUndo(function() {
            const idx = self._undoTiles.indexOf(tile);
            if (idx >= 0) self._undoTiles.splice(idx, 1);
            const childs = tile.getChildren && tile.getChildren() || [];
            childs.forEach((c:any) => {
                c.addParent && c.addParent(tile);
                c.state = TileStatus.Gray;
            });
            if (self._undoTiles.length === 0) self.logicStatus = LogicStatus.Idle;
        });
        return true;
    }

    doSuperWand(done: Function) {
        const collected = this.collector.CollectOrderTiles || [];
        const picks: any[] = [];
        if (collected.length > 0) {
            const byType: Record<number, any[]> = {};
            for (let i = 0; i < collected.length; i++) {
                const t = collected[i];
                const arr = byType[t.tIdx];
                if (arr) arr.push(t);
                else byType[t.tIdx] = [t];
            }
            let keys = ldKeys(byType);
            keys = keys.sort((a,b) => byType[parseInt(a)].length - byType[parseInt(b)].length);
            for (let i = keys.length - 1; i >= 0; --i) {
                const tid = parseInt(keys[i]);
                const arr = byType[tid];
                picks.push.apply(picks, arr);
                const merge = this.map.getMergeTiles && this.map.getMergeTiles(tid, 3 - arr.length) || [];
                picks.push.apply(picks, merge);
                if (picks.length >= 6) break;
            }
        }
        if (picks.length < 6) {
            for (let rep = 0; rep < 2; rep++) {
                const diff = difference(this.map.tileList, picks);
                if (diff.length === 0) break;
                const last = ldLast(diff);
                if (!last) break;
                let count = 0;
                for (let k = diff.length - 1; k >= 0; k--) {
                    const t = diff[k];
                    if (t.tIdx == last.tIdx) {
                        picks.push(t);
                        if (++count === 3) break;
                    }
                }
                if (picks.length >= 6) break;
            }
        }
        if (picks.length > 0) {
            if (config.debug && picks.length % 3 !== 0) console.log('wand eliminate tiles error:', picks);
            this.collector.playSuperEliminate && this.collector.playSuperEliminate(picks, done);
        } else {
            done();
        }
    }

    doWand(done: Function) {
        const collectOrder = this.collector.CollectOrderTiles || [];
        let foundTid: number | undefined;
        let foundCount = 0;
        if (collectOrder.length > 0) {
            const byType: Record<number, any[]> = {};
            for (let i = 0; i < collectOrder.length; i++) {
                const t = collectOrder[i];
                const arr = byType[t.tIdx];
                if (arr) arr.push(t);
                else byType[t.tIdx] = [t];
                if (byType[t.tIdx].length === 2) {
                    foundTid = t.tIdx;
                    foundCount = 2;
                    break;
                }
            }
            if (foundTid == null) {
                foundTid = ldLast(collectOrder).tIdx;
                foundCount = 1;
            }
        }
        const merges = this.map.getMergeTiles && this.map.getMergeTiles(foundTid, 3 - foundCount) || [];
        for (let i = 0; i < merges.length; i++) {
            const t = merges[i];
            this.collector.collect && this.collector.collect(t);
        }
        this.scheduleOnce && this.scheduleOnce(done, 0.4);
    }

    wand() {
        if (this.logicStatus == LogicStatus.Undo || this.logicStatus === LogicStatus.Idle || this.logicStatus === LogicStatus.Guide) {
            this.logicStatus = LogicStatus.Wand;
            this._taskQueus.clear && this._taskQueus.clear();
            const self = this;
            this._taskQueus.push((done: Function) => {
                if (self.isSupportWand() && MgrBonusWand.Instance.activeBonus) {
                    self.doSuperWand(done);
                } else {
                    self.doWand(done);
                }
            });
            this._taskQueus.complete = () => {
                self.logicStatus = LogicStatus.Idle;
            };
            this._taskQueus.play && this._taskQueus.play();
            return true;
        }
        return false;
    }

    removeShuffleEff() {
        if (this._shuffleEff) {
            const sk = this._shuffleEff.getComponent(sp.Skeleton);
            sk.setCompleteListener && sk.setCompleteListener(null);
            AssetPool.Instance.put && AssetPool.Instance.put(this._shuffleEff);
            this._shuffleEff = null;
        }
    }

    playShuffle() {
        if (this._shuffleEff) {
            const sk = this._shuffleEff.getComponent(sp.Skeleton);
            sk.clearTracks && sk.clearTracks();
            sk.setAnimation && sk.setAnimation(0, 'reset', false);
            return;
        }
        const eff = AssetPool.Instance.createObject && AssetPool.Instance.createObject(GamePrefabs.EffectTile.url);
        if (eff) {
            eff.parent = (this as any).node;
            eff.position = Vec3.ZERO;
            const sk = eff.getComponent(sp.Skeleton);
            sk.setCompleteListener && sk.setCompleteListener(() => {
                this._beDelShuffle = true;
            });
            sk.setAnimation && sk.setAnimation(0, 'reset', false);
            this._shuffleEff = eff;
        }
    }

    shuffle() {
        if (this.logicStatus == LogicStatus.Undo || this.logicStatus === LogicStatus.Idle || this.logicStatus === LogicStatus.Guide) {
            this.logicStatus = LogicStatus.Shuffle;
            this.map.shuffle && this.map.shuffle();
            this.playShuffle();
            this.scheduleOnce && this.scheduleOnce(() => {
                this.logicStatus = LogicStatus.Idle;
            }, 0.4);
            return true;
        }
        return false;
    }

    autoComplete(cb: Function) {
        if (this.logicStatus !== LogicStatus.Idle && this.logicStatus !== LogicStatus.Collect) {
            return false;
        }
        this.logicStatus = LogicStatus.Auto;
        this.collector.stopCollect && this.collector.stopCollect();
        this.collector.stopTipAnim && this.collector.stopTipAnim();

        const all: any[] = [];
        const collected = this.collector.Collected || [];
        const tileArray = this.map.calcTileArray && this.map.calcTileArray() || [];

        if (collected.length > 0) {
            let curCount = 1;
            let curTid = collected[0].tIdx;
            all.push(collected[0]);
            for (let i = 1; i < collected.length; i++) {
                const t = collected[i];
                if (curTid != t.tIdx) {
                    if (curCount < 3) {
                        const arr = tileArray[curTid] || [];
                        all.push.apply(all, arr.splice(0, 3 - curCount));
                    }
                    curTid = t.tIdx;
                    curCount = 1;
                } else {
                    if (++curCount === 3) curCount = 0;
                }
                all.push(t);
            }
            if (curCount < 3) {
                const arr = tileArray[curTid] || [];
                all.push.apply(all, arr.splice(0, 3 - curCount));
            }
        }

        each(tileArray, (arr:any) => {
            if (arr.length > 0) all.push.apply(all, arr);
        });

        this._taskQueus.clear && this._taskQueus.clear();

        const collectorNode = this.collector.node;
        for (let i = all.length - 1; i >= 0; i--) {
            const t = all[i];
            if (t.node.parent != collectorNode) {
                const world = t.node.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO);
                const local = collectorNode.getComponent(UITransform).convertToNodeSpaceAR(world);
                t.node.parent = collectorNode;
                t.node.position = local;
            }
            t.node.setSiblingIndex(all.length - i + 7);
        }

        MgrGame.Instance.wisdom = MgrGame.Instance.wisdom + Math.floor(all.length / 3);

        let goldTrigger = false;
        for (let i = 0; i < all.length; i++) {
            ((idx:number)=> {
                const tile = all[idx];
                this._taskQueus.push((done: Function) => {
                    if (tile.attachId > 0) {
                        this.collectAttachOne(tile.node.getWorldPosition(), tile.attachId);
                        tile.attachId = -1;
                    }
                    this.collector.playAutoEliminate && this.collector.playAutoEliminate(tile, () => {
                        if (tile.tIdx >= ITEM_CONST.GoldenTile && idx % 3 == 0) {
                            goldTrigger = true;
                            this.collectItemOne(tile.node.getWorldPosition(), tile.tIdx, 3);
                        }
                    });
                    this.scheduleOnce && this.scheduleOnce(done, 0.07);
                });
            })(i);
        }

        this._taskQueus.push((done: Function) => {
            let time = 1.8;
            if (goldTrigger) time = 2.2;
            this.scheduleOnce && this.scheduleOnce(done, time);
        });

        this._taskQueus.complete = () => {
            cb && cb();
        };

        this._taskQueus.play && this._taskQueus.play();
        return true;
    }

    collectAttachOne(worldPos: Vec3, itemId: number, num: number = 1) {
        const result = this.addAttachCount(itemId, num);
        MgrUser.Instance.userData.flyAddItem && MgrUser.Instance.userData.flyAddItem({
            sourcePos: worldPos,
            itemId,
            change: 1,
            result,
            callback: () => {
                director.emit && director.emit(GlobalEvent.GameCollectedAttachItemChange + itemId, result);
            }
        });
    }

    collectItemOne(worldPos: Vec3, itemId: number, num: number) {
        if (itemId == ITEM_CONST.GoldenTile) {
            this.collectGoldCubeOne(worldPos, num);
        }
    }

    collectGoldCubeOne(worldPos: Vec3, num: number) {
        const coins = Math.floor(GAME_CONST.GOLDTILE_COIN_NUM / 3 * num);
        MgrUser.Instance.userData.addItem && MgrUser.Instance.userData.addItem(ITEM_CONST.Coin, coins, { sourcePos: worldPos, type: 'GoldenMatch' });
        const taskCount = Math.floor(num / 3);
        MgrTask.Instance.data.addTaskData && MgrTask.Instance.data.addTaskData(TASK_TYPE.MATCH_GOLD_TILE, taskCount);
        if (this.delegate && this.delegate.isGoldTourOpen) {
            this._collectGoldCube += num;
            const info = {
                sourcePos: worldPos,
                itemId: ITEM_CONST.GoldenTile,
                change: num,
                result: this._collectGoldCube,
            };
            MgrUser.Instance.userData.flyAddItem && MgrUser.Instance.userData.flyAddItem(info);
        }
    }

    collectedEvent(tile: any) {
        this.map.removeTile && this.map.removeTile(tile);
        if (tile.attachId > 0) {
            this.collectAttachOne(tile.node.worldPosition, tile.attachId);
            tile.attachId = -1;
        }
        if (this.logicStatus == LogicStatus.Idle) {
            if (AppGame.gameCtrl.currMode == GameMode.Challenge || this.getCurrLevel() > 1) {
                const tileCnt = this.map.tileList.length;
                const collectedCnt = this.collector.Collected.length;
                if (tileCnt > 0) {
                    for (let i = 0; i < tileCnt; i++) {
                        if (!this.map.tileList[i].CollectEnable()) return;
                    }
                    if (collectedCnt > 0 && this.map.tileList.length <= 11 && tileCnt + collectedCnt <= 15) {
                        this.option.playShowAuto && this.option.playShowAuto();
                    }
                }
            }
        }
    }

    eliminateEvent(data: any[]) {
        if (data.length > 0) {
            const tileId = data[0].tIdx;
            const tile = data[1];
            if (tileId >= ITEM_CONST.GoldenTile) {
                this.collectItemOne(tile.node.getWorldPosition(), tileId, data.length);
            }
        }
    }

    endComplementEvent() {
        if (this.logicStatus == LogicStatus.Collect) this.logicStatus = LogicStatus.Idle;
    }

    victory() {
        if (this.logicStatus != LogicStatus.Victory && this.logicStatus != LogicStatus.Fail) {
            this.logicStatus = LogicStatus.Victory;
            const gold = this._collectGoldCube;
            const attaches = cloneDeep ? cloneDeep(this._collectedAttachs) : JSON.parse(JSON.stringify(this._collectedAttachs));
            const info = {
                level: this.getCurrLevel(),
                goldCube: gold,
                attachs: attaches,
            };
            this.onVictory && this.onVictory(info);
            director.emit && director.emit(GlobalEvent.GameVictory);
            return info;
        }
        return undefined;
    }

    private _openFaildView() {
        MgrUi.Instance.openViewAsync && MgrUi.Instance.openViewAsync(UIPrefabs.GameFailed);
    }

    failed(err?: any) {
        if (this.logicStatus != LogicStatus.Victory && this.logicStatus != LogicStatus.Fail) {
            this.logicStatus = LogicStatus.Fail;
            MgrAnalytics.Instance.stopGameTime && MgrAnalytics.Instance.stopGameTime();
            MgrAnalytics.Instance.interstitialCnt = 0;
            MgrAnalytics.Instance.eliminateCnt = 0;
            this.onFailed && this.onFailed(err);
            const openUi = AppGame.gameCtrl.currMode === GameMode.Challenge ? 'ChallengeFail' : 'Fail';
            const self = this;
            NativeBridge.Instance.showInterstitialIfCooldown && NativeBridge.Instance.showInterstitialIfCooldown({
                OpenUi: openUi,
                errCallback: function() {
                    self._openFaildView();
                },
                closeCallback: function() {
                    self._openFaildView();
                }
            });
            this.emit(GlobalEvent.GameFailed);
            director.emit && director.emit(GlobalEvent.GameFailed);
        }
    }

    replay() {
        MgrGame.Instance.wisdom = 0;
        this.onReplay && this.onReplay();
        this.emit(GlobalEvent.GameReplay);
    }

    revive(data?: any) {
        this.onRevive && this.onRevive(data);
        this.logicStatus = LogicStatus.Revive;
        this._taskQueus.clear && this._taskQueus.clear();
        const collectedLen = this.collector.Collected.length;
        for (let i = 0; i < collectedLen - 2; i++) {
            ((idx:number) => {
                this._taskQueus.push((done: Function) => {
                    const t = this.collector.undo && this.collector.undo(this.map.root);
                    this.map.addTile && this.map.addTile(t);
                    t.playUndo && t.playUndo(() => {
                        const childs = t.getChildren && t.getChildren() || [];
                        childs.forEach((c:any) => {
                            c.addParent && c.addParent(t);
                            c.state = TileStatus.Gray;
                        });
                        done();
                    });
                });
            })(i);
        }

        this._taskQueus.push((done: Function) => {
            this.collector.complement && this.collector.complement();
            done();
        });

        this._taskQueus.push((done: Function) => {
            this.map.shuffle && this.map.shuffle();
            this.scheduleOnce && this.scheduleOnce(done, 0.4);
        });

        this._taskQueus.complete = () => {
            MgrAnalytics.Instance.resumeGameTime && MgrAnalytics.Instance.resumeGameTime();
            this.logicStatus = LogicStatus.Idle;
            this.collector.checkPlayTip && this.collector.checkPlayTip();
            this.emit(GlobalEvent.GameRevive);
            director.emit && director.emit(GlobalEvent.GameRevive);
        };

        this._taskQueus.play && this._taskQueus.play();
    }

    lateUpdate(dt: number) {
        if (this._beDelShuffle) {
            this._beDelShuffle = false;
            this.removeShuffleEff();
        }
    }

    // ---------- getters / setters ----------
    get logicStatus() {
        return this._status;
    }
    set logicStatus(v: LogicStatus) {
        this._status = v;
        director.emit && director.emit(GlobalEvent.ChangeGameLogicStatus);
    }

    get map() {
        return this.delegate && this.delegate.gameMap;
    }

    get storage() {
        return this.delegate && this.delegate.storage;
    }

    get collector() {
        return this.delegate && this.delegate.collector;
    }

    get option() {
        return this.delegate && this.delegate.option;
    }

    get collectGoldCube() {
        return this._collectGoldCube;
    }
    set collectGoldCube(v: number) {
        this._collectGoldCube = v;
        AppGame.topUI && AppGame.topUI.goldCubeBtn && AppGame.topUI.goldCubeBtn.setGoldCubeCount && AppGame.topUI.goldCubeBtn.setGoldCubeCount(v);
    }

    get collectedAttachs() {
        return this._collectedAttachs;
    }

    get touchTileEnable() {
        return this.delegate && this.delegate.gameState == GameStatus.Playing && (this.logicStatus == LogicStatus.Idle || this.logicStatus == LogicStatus.Collect);
    }

    // ---------- stubbed / expected to be implemented by concrete subclass or delegate ----------
    getCurrLevel(): number { return 0; }
    getStorageData(level: number): any { return null; }
    loadLevelCfg(level: number): Promise<any> { return Promise.resolve([]); }
    getAlgorithm(level: number): any { return { algorithm: null, algorithmParam: null }; }
    getElementCnt(level: number): number { return 0; }
    getAttachInfo(): any { return null; }
}