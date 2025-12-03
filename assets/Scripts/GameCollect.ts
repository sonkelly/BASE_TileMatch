import { _decorator, Component, Node, Button, Layout, tween, Tween, v3, Vec3, UITransform, easing, sp, director, Color } from 'cc';
import {GameTile, TILE_EVENT as TILE_EVENT_CONST } from './GameTile';
import { MgrGame, MAX_COLLECTED, TileStatus } from './MgrGame';
import { GamePrefabs, GameAudios } from './Prefabs';
import {AppGame} from './AppGame';
import { GlobalEvent } from './Events';
import {Bezier} from './Bezier';
import {AssetPool} from './AssetPool';
import {Utils} from './Utils';
import {MgrTask} from './MgrTask';
import { TASK_TYPE } from './Const';
import { config } from './Config';
import { GameConst } from './GameConst';
import { LogicStatus } from './GameLogic';
import {AsyncQueue} from './AsyncQueue';
import {MgrUi} from './MgrUi';
import { AudioPlayer } from './AudioPlayer';

const { ccclass, property } = _decorator;
const ZERO_VEC3 = Vec3.ZERO;
const SCALE_TWO = v3(2, 2, 2);
const BEZIER_PRESET = [v3(100, 510, 0), v3(280, 410, 0), v3(280, 90, 0)];

class ComposeMotion {
    private _tiles: GameTile[] = [];
    static _motions: ComposeMotion[] = [];

    constructor(tiles?: GameTile[]) {
        if (tiles) this._tiles = tiles;
    }

    static getMotion(tiles: GameTile[]) {
        if (this._motions.length > 0) {
            return this._motions.pop()!.setTiles(tiles);
        }
        return new ComposeMotion(tiles);
    }

    setTiles(tiles: GameTile[]) {
        this._tiles = tiles;
        return this;
    }

    clear() {
        this._tiles.forEach(t => t.Recycle && t.Recycle());
        this._tiles.length = 0;
        ComposeMotion._motions.push(this);
    }

    get tiles() {
        return this._tiles;
    }
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) return i;
    }
    return -1;
}

@ccclass('GameCollect')
export class GameCollect extends Component {
    @property(Node)
    public fullTipNode: Node | null = null;

    @property(Node)
    public addationBox: Node | null = null;

    @property(Button)
    public adBox: Button | null = null;

    // internal state
    private _fullTip: boolean = false;
    private _flyInMotionList: GameTile[] = [];
    private _backOffMotionList: GameTile[] = [];
    private _composeMotionList: ComposeMotion[] = [];
    private _elimiWaitList: GameTile[] = [];
    private _collPosList: Vec3[] = [];
    private _collectedTilesArr: GameTile[] = [];
    private _collectedOrderTiles: GameTile[] = [];
    private _gameCtrlDelegate: any = null;
    private _maxCollectCnt: number = MAX_COLLECTED;
    private _complementing: boolean = false;
    public collectAnim: Tween<Node> | null = null;
    public collectAnim2: Tween<Node> | null = null;
    private _superWandAsync: AsyncQueue = new AsyncQueue();
    private _autoCompletePosArr: Vec3[] = [];
    private _bezier: Bezier | null = null;

    onLoad() {
        if (this.adBox && this.adBox.node) {
            this.adBox.node.on('click', this.onTouchAdBox, this);
        }
    }

    onEnable() {
        this.initAdAddBox();
        this.initCollPosition();
    }

    onTouchAdBox() {
        this.delegate && this.delegate.onAddCollectBox && this.delegate.onAddCollectBox();
    }

    reInitAdAddBox() {
        this.initAdAddBox();
        this.initCollPosition();
    }

    initAdAddBox() {
        const layout = this.node.getComponent(Layout);
        if (layout) layout.enabled = true;
        if (this.addationBox) {
            this.addationBox.active = MgrGame.Instance.gameData.curLv >= GameConst.Unlock_Space_Open_Level;
        }
        const pos = this.node.getPosition();
        pos.x = this.addationBox && this.addationBox.active ? 0 : 0.5 * (this.addationBox && (this.addationBox as any)._uiProps?.uiTransformComp?.width || 0);
        this.node.position = pos;
        if (layout) {
            layout.updateLayout(true);
            layout.enabled = false;
        }
    }

    initCollPosition() {
        this._collPosList.length = 0;
        const children = this.node.children;
        let idx = 0;
        for (let i = 0; i < children.length; i++) {
            const c = children[i];
            if (c.active) {
                let pos = this._collPosList[idx];
                if (pos) {
                    pos.set(c.position);
                } else {
                    pos = v3(c.position);
                    this._collPosList.push(pos);
                }
                pos.y += 10;
                idx++;
            }
        }
    }

    clear() {
        this.unscheduleAllCallbacks();
        this._flyInMotionList.length = 0;
        this._backOffMotionList.length = 0;
        this._composeMotionList.forEach(m => m.clear());
        this._composeMotionList.length = 0;
        this._elimiWaitList.length = 0;
        this._collectedTilesArr.forEach(t => t.Recycle && t.Recycle());
        this._collectedOrderTiles.length = 0;
        this._collectedTilesArr.length = 0;
        this._complementing = false;
        this._superWandAsync.clear();
        this.stopTipAnim();
        this.stopFullTip();
    }

    playEnter() {
        this.stopTipAnim();
        const children = this.node.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            Tween.stopAllByTarget(child);
            child.scale = Vec3.ZERO;
            tween(child).delay(0.12 * i * 0.5).to(0.12, { scale: Vec3.ONE }).start();
        }
    }

    playExit() {
        this.stopTipAnim();
        const children = this.node.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            Tween.stopAllByTarget(child);
            tween(child).delay(0.12 * i * 0.5).to(0.12, { scale: Vec3.ZERO }).start();
        }
    }

    restore(tiles: GameTile[], maxCollectCnt: number = MAX_COLLECTED) {
        const self = this;
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            let idx = findLastIndex(self._collectedTilesArr, t => t.tIdx == tile.tIdx);
            if (idx < 0) idx = self._collectedTilesArr.length;
            else idx += 1;
            self._collectedTilesArr.splice(idx, 0, tile);
            for (let j = idx + 1; j < self._collectedTilesArr.length; j++) {
                const tnode = self._collectedTilesArr[j].node;
                tnode.position = self._collPosList[j];
            }
            self._collectedOrderTiles.push(tile);
            const pos = self._collPosList[idx];
            tile.state = TileStatus.Collect;
            tile.node.parent = self.node;
            tile.node.position = pos;
            tile.node.scale = Vec3.ONE;
            tile.emit(TILE_EVENT_CONST.Collect, tile);
            tile.setColor(Color.WHITE);
        }
        this.checkPlayTip();
        this.maxCollectCnt = maxCollectCnt;
    }

    collect(tile: GameTile) {
        if (this.Eliminateing) this.complement();
        const tIdx = tile.tIdx;
        let insertIdx = findLastIndex(this._collectedTilesArr, t => t.tIdx == tIdx);
        if (insertIdx < 0) insertIdx = this._collectedTilesArr.length;
        else insertIdx += 1;
        this._flyIn(tile, insertIdx);
        this.delegate && this.delegate.collectedEvent && this.delegate.collectedEvent(tile);
        if (insertIdx < this._collectedTilesArr.length - 1) {
            for (let i = insertIdx + 1; i < this._collectedTilesArr.length; i++) {
                this._backOff(this._collectedTilesArr[i], i);
            }
        }
        if (MgrGame.Instance.gameData.curLv == 1) {
            director.emit(GlobalEvent.NextGuide);
        }
        return true;
    }

    stopCollect() {
        this._backOffMotionList.length = 0;
        this._collectedOrderTiles.length = 0;
        this._flyInMotionList.length = 0;
        this.unscheduleAllCallbacks();
    }

    private _flyIn(tile: GameTile, insertIdx: number) {
        const relativePosWorld = tile.node.getComponent(UITransform)!.convertToWorldSpaceAR(ZERO_VEC3);
        const relativePosNode = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(relativePosWorld);
        tile.state = TileStatus.Collect;
        tile.node.parent = this.node;
        tile.node.position = relativePosNode;
        this._flyInMotionList.push(tile);
        this._collectedTilesArr.splice(insertIdx, 0, tile);
        this._collectedOrderTiles.push(tile);
        const targetPos = this._collPosList[insertIdx];
        tile.playCollect && tile.playCollect(targetPos);
        this.scheduleOnce(() => {
            this._flyInEnd(tile);
        }, 0.25);
    }

    private _flyInEnd(tile: GameTile) {
        const idx = this._flyInMotionList.indexOf(tile);
        if (idx >= 0) this._flyInMotionList.splice(idx, 1);
        this._eliminate(tile);
        this.checkPlayTip();
    }

    private _backOff(tile: GameTile, idx: number) {
        if (this._backOffMotionList.indexOf(tile) < 0) this._backOffMotionList.push(tile);
        tween(tile.node).to(0.12, { position: this._collPosList[idx] }, { easing: easing.smooth }).start();
        this.scheduleOnce(() => {
            this._backOffEnd(tile);
        }, 0.12);
    }

    private _backOffEnd(tile: GameTile) {
        const idx = this._backOffMotionList.indexOf(tile);
        if (idx >= 0) this._backOffMotionList.splice(idx, 1);
    }

    private _eliminate(tile: GameTile) {
        const idx = this._collectedTilesArr.indexOf(tile);
        const pre1 = idx - 1;
        const pre2 = idx - 2;
        if (pre2 < 0 || pre1 < 0 || idx < 0) {
            if (this._flyInMotionList.length <= 0) this.delegate && this.delegate.settlementOnce && this.delegate.settlementOnce();
            this._checkComplement();
            return;
        }
        const t0 = tile;
        const t1 = this._collectedTilesArr[pre1];
        const t2 = this._collectedTilesArr[pre2];
        if (t0.tIdx != t1.tIdx || t2.tIdx != t1.tIdx) {
            if (this._flyInMotionList.length <= 0) this.delegate && this.delegate.settlementOnce && this.delegate.settlementOnce();
            this._checkComplement();
            return;
        }
        if (this.Complementing || this.Eliminateing) {
            this._elimiWaitList.push(tile);
        } else {
            const list: GameTile[] = [];
            list.push(t2);
            list.push(t1);
            list.push(t0);
            AudioPlayer.Instance.playEffect(GameAudios.ShootComp.url);
            this.showMergeEft(idx);
            this.showMergeEft(pre1);
            this.showMergeEft(pre2);
            const motion = ComposeMotion.getMotion(list);
            this._composeMotionList.push(motion);
            this.removeTile(t2);
            this.removeTile(t1);
            this.removeTile(t0);
            t2.playRemove && t2.playRemove(0);
            t1.playRemove && t1.playRemove(0.05);
            t0.playRemove && t0.playRemove(0.1);
            this.scheduleOnce(() => {
                this._endEliminate(motion);
            }, 0.32);
            this.delegate && this.delegate.eliminateEvent && this.delegate.eliminateEvent(list);
            MgrTask.Instance.data.addTaskData(TASK_TYPE.MATCH, 1);
        }
    }

    playAutoEliminate(node: Node, cb: Function) {
        if (this._autoCompletePosArr.length === 0) {
            this._autoCompletePosArr = BEZIER_PRESET.concat([this._collPosList[4]]);
        }
        const posArr = this._autoCompletePosArr;
        if (!this._bezier) this._bezier = new Bezier(posArr);
        const bez = this._bezier;
        const fnUpdate: any = Object.create(null);
        fnUpdate.onUpdate = (tgtNode: any, t: number) => {
            tgtNode.node.position = bez.getPoint(t, tgtNode.node.position);
        };
        const scaleTemp = v3(1.4, 1.4, 1.4);
        tween(node)
            .to(0.45, { position: posArr[0] })
            .parallel(
                tween().to(0.9, { position: posArr[posArr.length - 1] }, fnUpdate).to(0.33, { position: this._collPosList[0] }),
                tween().to(0.315, { scale: SCALE_TWO }).delay(0.4).to(0.9 * 0.405, { scale: Vec3.ONE })
            )
            .call(() => {
                node.setSiblingIndex(node.parent!.children.length - 1);
                this.showMergeEft(0);
                AudioPlayer.Instance.playEffect(GameAudios.ShootComp.url);
            })
            .to(0.12, { scale: scaleTemp })
            .to(0.15, { scale: Vec3.ZERO })
            .start();
        this.scheduleOnce(cb as any, 1.62);
    }

    showMergeEft(idx: number) {
        const effect = AssetPool.Instance.createObject(GamePrefabs.EffectMerge.url);
        effect.parent = this.node;
        effect.angle = 360 * Math.random();
        effect.scale = Vec3.ONE;
        const offX = Utils.randomRange(-10, 10);
        const offY = Utils.randomRange(-10, 10);
        const pos = v3(this._collPosList[idx].x + offX, offY, 0);
        effect.setPosition(pos);
        const sk = effect.getComponent(sp.Skeleton);
        if (sk) {
            sk.setCompleteListener(() => {
                sk.setCompleteListener(null);
                AssetPool.Instance.put(sk);
            });
            sk.setAnimation(0, 'eliminate', false);
        }
    }

    private _endEliminate(motion: ComposeMotion) {
        motion.clear();
        const idx = this._composeMotionList.indexOf(motion);
        if (idx >= 0) this._composeMotionList.splice(idx, 1);
        this.delegate && this.delegate.onEndEliminateEvent && this.delegate.onEndEliminateEvent();
        if (this._elimiWaitList.length > 0) {
            const next = this._elimiWaitList.shift()!;
            this._eliminate(next);
        } else {
            this._checkComplement();
        }
    }

    private _checkComplement() {
        if (config.debug) {
            console.log('_checkComplement Collecting', this.Collecting);
            console.log('_checkComplement Eliminateing', this.Eliminateing);
            console.log('_checkComplement Complementing', this.Complementing);
        }
        if (!this.Collecting && !this.Eliminateing && !this.Complementing) {
            this.complement();
        }
    }

    complement() {
        const moveList: GameTile[] = [];
        for (let i = 0; i < this._collectedTilesArr.length; i++) {
            const tx = this._collectedTilesArr[i].node.position.x;
            const cx = this._collPosList[i].x;
            if (Math.abs(tx - cx) > 0.1) moveList.push(this._collectedTilesArr[i]);
        }
        if (moveList.length !== 0) {
            this._complementing = true;
            for (let i = 0; i < moveList.length; i++) {
                const t = moveList[i];
                const posIdx = this._collectedTilesArr.indexOf(t);
                const target = this._collPosList[posIdx];
                tween(t.node).to(0.12, { position: target }, { easing: easing.smooth }).start();
            }
            this.scheduleOnce(() => {
                this._endComplement();
            }, 0.12);
        } else {
            if (!this._complementing) this._endComplement();
        }
    }

    private _endComplement() {
        console.log('_endComplement');
        this._complementing = false;
        if (this._elimiWaitList.length > 0) {
            const t = this._elimiWaitList.shift()!;
            this._eliminate(t);
        } else {
            this.delegate && this.delegate.endComplementEvent && this.delegate.endComplementEvent();
            this.delegate && this.delegate.settlementOnce && this.delegate.settlementOnce();
        }
    }

    removeTile(tile: GameTile) {
        tile.state = TileStatus.Remove;
        let idx = this._collectedTilesArr.indexOf(tile);
        if (idx >= 0) this._collectedTilesArr.splice(idx, 1);
        idx = this._collectedOrderTiles.indexOf(tile);
        if (idx >= 0) this._collectedOrderTiles.splice(idx, 1);
    }

    undo(backToNode: Node) {
        if (this._collectedOrderTiles.length > 0) {
            const last = this._collectedOrderTiles.pop()!;
            const index = this._collectedTilesArr.indexOf(last);
            if (index < 0) console.error('撤回异常！！！');
            this._collectedTilesArr.splice(index, 1);
            const worldPos = last.node.getComponent(UITransform)!.convertToWorldSpaceAR(ZERO_VEC3);
            const localPos = backToNode.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
            last.node.parent = backToNode;
            last.node.position = localPos;
            this.complement();
            this.checkPlayTip();
            return last;
        }
        return null;
    }

    checkPlayTip() {
        const status = AppGame.gameCtrl.curLogic.logicStatus;
        const disabled = status == LogicStatus.Fail || status == LogicStatus.Victory || status == LogicStatus.None;
        if (this._collectedTilesArr.length >= this._maxCollectCnt - 2 && !disabled) {
            this.playTipAnim();
        } else {
            this.stopTipAnim();
        }
        if (this._collectedTilesArr.length == this._maxCollectCnt - 1) {
            this.playFullTip();
        } else {
            this.stopFullTip();
        }
        this._fullTip = this._collectedTilesArr.length == this._maxCollectCnt - 1;
    }

    playFullTip() {
        if (this._fullTip) return;
        if (this.fullTipNode) {
            this.fullTipNode.active = true;
            Tween.stopAllByTarget(this.fullTipNode);
            this.fullTipNode.scale = Vec3.ZERO;
            tween(this.fullTipNode).to(0.15, { scale: Vec3.ONE }, { easing: easing.backOut }).start();
        }
    }

    stopFullTip() {
        if (!this._fullTip) return;
        if (this.fullTipNode) {
            Tween.stopAllByTarget(this.fullTipNode);
            tween(this.fullTipNode).to(0.15, { scale: Vec3.ZERO }, { easing: easing.backIn }).call(() => {
                this.fullTipNode!.active = false;
            }).start();
        }
    }

    playTipAnim() {
        if (this.collectAnim) {
            this.collectAnim.stop();
            this.collectAnim2 && this.collectAnim2.stop();
            this.node.scale = Vec3.ONE;
            this.collectAnim.start();
        } else {
            this.collectAnim2 = tween(this.node)
                .to(0.25, { scale: v3(1.05, 1.1) })
                .to(0.25, { scale: Vec3.ONE })
                .to(0.25, { scale: v3(1.05, 1.1) })
                .to(0.25, { scale: Vec3.ONE })
                .delay(2)
                .union()
                .repeatForever();
            this.collectAnim = tween(this.node).delay(3).call(() => {
                this.collectAnim2 && this.collectAnim2.start();
            }).start();
        }
    }

    stopTipAnim() {
        if (this.collectAnim || this.collectAnim2) {
            this.collectAnim && this.collectAnim.stop();
            this.collectAnim2 && this.collectAnim2.stop();
            this.node.scale = Vec3.ONE;
            this.collectAnim = null;
            this.collectAnim2 = null;
        }
    }

    playRemove(tiles: GameTile[], delay?: number) {
        for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            if (t.state < TileStatus.Collect) {
                t.emit(TILE_EVENT_CONST.Collect, t);
                this.delegate && this.delegate.collectedEvent && this.delegate.collectedEvent(t);
            }
            this.removeTile(t);
            t.playShakeRemove && t.playShakeRemove();
        }
        this.delegate && this.delegate.eliminateEvent && this.delegate.eliminateEvent(tiles);
    }

    playSuperEliminate(tileList: GameTile[], cb: Function) {
        this._superWandAsync.clear();
        const self = this;
        const worldPos = v3(0, -250, 0);

        this._superWandAsync.push((next: Function) => {
            worldPos.set(0, -250, 0);
            const node = AssetPool.Instance.createObject(GamePrefabs.WandEliminateSuper.url);
            node.parent = MgrUi.root(1);
            node.position = worldPos;
            const sk = node.getComponent(sp.Skeleton);
            if (sk) {
                sk.setAnimation(0, 'super_eliminate', false);
                sk.timeScale = 1.2;
                sk.setCompleteListener(() => {
                    sk.setCompleteListener(null);
                    AssetPool.Instance.put(node);
                });
            }
            AudioPlayer.Instance.playEffect(GameAudios.SuperHint.url);
            self.scheduleOnce(() => {
                worldPos.set(node.worldPosition);
                next();
            }, 0.5);
        });

        this._superWandAsync.push((next: Function) => {
            let delay = 0.5;
            while (tileList.length > 0) {
                const a = tileList.shift()!;
                const b = tileList.shift()!;
                const c = tileList.shift()!;
                a.playSuperLight && a.playSuperLight(worldPos, delay);
                b.playSuperLight && b.playSuperLight(worldPos, delay);
                c.playSuperLight && c.playSuperLight(worldPos, delay);
                self.playRemove([a, b, c], 0.25);
            }
            self.scheduleOnce(() => {
                next();
            }, delay);
        });

        this._superWandAsync.push((next: Function) => {
            self.delegate && self.delegate.onEndEliminateEvent && self.delegate.onEndEliminateEvent();
            self._checkComplement();
            next();
        });

        this._superWandAsync.complete = () => {
            self.checkPlayTip();
            cb && cb();
        };

        this._superWandAsync.play();
    }

    // getters / setters
    get Collected() {
        return this._collectedTilesArr;
    }

    get CollectOrderTiles() {
        return this._collectedOrderTiles;
    }

    get delegate() {
        return this._gameCtrlDelegate;
    }

    set delegate(v: any) {
        this._gameCtrlDelegate = v;
    }

    get maxCollectCnt() {
        return this._maxCollectCnt;
    }

    set maxCollectCnt(v: number) {
        this._maxCollectCnt = v;
        if (this.adBox && this.adBox.node) {
            this.adBox.node.active = this._maxCollectCnt == MAX_COLLECTED;
        }
    }

    get isFull() {
        return this.Collected.length >= this._maxCollectCnt;
    }

    get Collecting() {
        return this._flyInMotionList.length > 0 || this._backOffMotionList.length > 0;
    }

    get Eliminateing() {
        return this._composeMotionList.length > 0;
    }

    get Complementing() {
        return this._complementing;
    }

    get settlementEnable() {
        return !(this._composeMotionList.length > 0) && !(this._elimiWaitList.length > 0) && !(this._flyInMotionList.length > 0);
    }
}