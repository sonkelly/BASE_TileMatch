import { _decorator, Component, Vec3, Vec2, Sprite, Color, UIRenderer, Node, Tween, sp, tween, easing, v3, misc, UITransform } from 'cc';
import { TileStatus } from './MgrGame';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { IEmitter } from './IEmitter';
import { TILE_SIZE } from './Const';
import { AssetPool } from './AssetPool';
import { MgrSkin } from './MgrSkin';
import { IMAGE_MONTH_TILE, ITEM_COIN_PATH, ITEM_GOLD_CUBE_PATH, GamePrefabs } from './Prefabs';
import { MgrMonthTile } from './MgrMonthTile';
import {AssetsCfg} from './AssetsCfg';
import {MgrUi} from './MgrUi';
import { ITEM } from './GameConst';
import {pullAt} from 'lodash-es';

const { ccclass, property } = _decorator;

export const TILE_EVENT = {
    Remove: 'remove',
    Collect: 'collect',
    BackPos: 'backpos',
    Click: 'click',
    ChangeAttach: 'change-attach',
    ChangeTileId: 'change-id',
    ChangeStatus: 'change-status'
};

@ccclass('GameTile')
export class GameTile extends IEmitter {
    @property(Sprite)
    attachSprite: Sprite | null = null;

    @property(Sprite)
    tileSprite: Sprite | null = null;

    private _idx: number = -1;
    private _tIdx: number = -1;
    private _layer: number = 0;
    private _tilePos: Vec2 | null = null;
    private _attachId: number = 99;
    private delegate: any = null;
    private _parentList: any[] = [];
    private _childList: any[] = [];
    private _state: TileStatus = TileStatus.Light;
    private _viewScale: number = 1;
    private _tempColor: Color = new Color();
    private _pre: GameTile | null = null;
    private _next: GameTile | null = null;
    private tileEff: Node | null = null;
    private lightEff: Node | null = null;
    private _beDelTileEff: boolean = false;
    private _beDelLightEff: boolean = false;
    private _renders: UIRenderer[] = [];
    private _touched: boolean = false;

    setTIdx(tIdx: number) {
        this._tIdx = tIdx;
    }

    onLoad() {
        this._renders = this.node.getComponentsInChildren(UIRenderer);
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    refreshView() {
        switch (this._tIdx) {
            case ITEM.GoldenTile:
                this.tileSprite!.spriteFrame = AssetMgr.Instance.getSpriteFrame(BUNDLE_NAMES.Game, ITEM_GOLD_CUBE_PATH);
                break;
            case ITEM.TileCoin:
                this.tileSprite!.spriteFrame = AssetMgr.Instance.getSpriteFrame(BUNDLE_NAMES.Game, ITEM_COIN_PATH);
                break;
            default:
                const monthTile = MgrMonthTile.Instance.triggerMonthTile();
                if (monthTile && monthTile.sTile === this._tIdx) {
                    this.tileSprite!.spriteFrame = AssetMgr.Instance.getSpriteFrame(BUNDLE_NAMES.Game, `${IMAGE_MONTH_TILE}/${monthTile.tTile}`);
                    return;
                }
                const iconUrl = MgrSkin.Instance.getIconUrl(this._tIdx);
                this.tileSprite!.spriteFrame = AssetMgr.Instance.getSpriteFrame(BUNDLE_NAMES.Game, iconUrl);
        }
    }

    refreshAttachView() {
        this.attachSprite!.node.parent!.active = this._attachId > 0;
        if (this._attachId > 0) {
            this.attachSprite!.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(this._attachId);
        }
    }

    onDisable() {
        Tween.stopAllByTarget(this.node);
        Tween.stopAllByTarget(this._tempColor);
    }

    playTileEffect() {
        if (this.tileEff) {
            const skeleton = this.tileEff.getComponent(sp.Skeleton);
            skeleton!.clearTracks();
            skeleton!.setAnimation(0, 'hint', false);
            return;
        }
        const effectTile = AssetPool.Instance.createObject(GamePrefabs.EffectTile.url);
        effectTile.parent = this.node;
        effectTile.position = Vec3.ZERO;
        const skeleton = effectTile.getComponent(sp.Skeleton);
        skeleton!.setCompleteListener(() => {
            this._beDelTileEff = true;
        });
        skeleton!.setAnimation(0, 'hint', false);
        this.tileEff = effectTile;
    }

    removeTileEffect() {
        if (this.tileEff) {
            const skeleton = this.tileEff.getComponent(sp.Skeleton);
            skeleton!.setCompleteListener(null);
            AssetPool.Instance.put(this.tileEff);
            this.tileEff = null;
        }
    }

    removeLightEffect() {
        if (this.lightEff) {
            const skeleton = this.lightEff.getComponent(sp.Skeleton);
            skeleton!.setCompleteListener(null);
            AssetPool.Instance.put(this.lightEff);
            this.lightEff = null;
        }
    }

    setViewScale(viewScale: number) {
        this._viewScale = viewScale;
    }

    setColor(color: Color) {
        this._renders.forEach((renderer) => {
            renderer.color = color;
        });
    }

    calcIndex() {
        let index = 0;
        let current = this.pre;
        while (current) {
            if (current.state >= TileStatus.Collect) {
                current = current.pre;
            } else {
                index = current ? current.node.getSiblingIndex() : 0;
                break;
            }
        }
        return index + 1;
    }

    refreshStatus() {
        switch (this._state) {
            case TileStatus.Gray:
                this.playGray();
                break;
            case TileStatus.Light:
                this.playWhite();
                break;
        }
    }

    playEnter(callback?: Function) {
        Tween.stopAllByTarget(this.node);
        Tween.stopAllByTarget(this._tempColor);
        this.setColor(Color.WHITE);
        this.node.scale = Vec3.ZERO;
        this.node.angle = 0;
        const targetScale = new Vec3(this._viewScale, this._viewScale, this._viewScale);
        tween(this.node)
            .to(0.15, { scale: targetScale }, { easing: easing.linear })
            .call(() => {
                if (callback) callback();
            })
            .start();
    }

    playUndo(callback?: Function) {
        Tween.stopAllByTarget(this.node);
        Tween.stopAllByTarget(this._tempColor);
        this.setColor(Color.WHITE);
        const targetScale = new Vec3(this._viewScale, this._viewScale, this._viewScale);
        const tilePos = this.tilePos!;
        const targetPosition = new Vec3(tilePos.x * TILE_SIZE * this._viewScale, tilePos.y * TILE_SIZE * this._viewScale, 0);
        this._state = TileStatus.Init;
        tween(this.node)
            .to(0.12, { scale: targetScale, position: targetPosition }, { easing: easing.smooth })
            .call(() => {
                this.node.setSiblingIndex(this.calcIndex());
                this.CollectEnable() ? (this.state = TileStatus.Light) : (this.state = TileStatus.Gray);
                if (callback) callback();
            })
            .start();
    }

    playGray() {
        this.setColor(Color.WHITE);
        Tween.stopAllByTarget(this._tempColor);
        this._tempColor.set(this.tileSprite!.color);
        tween(this._tempColor)
            .to(0.5, { r: 150, g: 150, b: 150 }, {
                onUpdate: (color) => {
                    this.setColor(color);
                },
                easing: easing.sineOut
            })
            .start();
    }

    playWhite() {
        Tween.stopAllByTarget(this._tempColor);
        this._tempColor.set(this.tileSprite!.color);
        tween(this._tempColor)
            .to(0.3, { r: 255, g: 255, b: 255 }, {
                onUpdate: (color) => {
                    this.setColor(color);
                },
                easing: easing.smooth
            })
            .start();
    }

    playShake() {
        Tween.stopAllByTarget(this.node);
        const targetScale = new Vec3(this._viewScale, this._viewScale, 1);
        this.node.scale = targetScale;
        const tilePos = this.tilePos!;
        const targetPosition = v3(tilePos.x * TILE_SIZE * this._viewScale, tilePos.y * TILE_SIZE * this._viewScale, 0);
        this.node.position = targetPosition;
        tween(this.node)
            .by(0.03, { position: v3(10, 0, 0) }, { easing: easing.linear })
            .by(0.1, { position: v3(-17, 0, 0) }, { easing: easing.linear })
            .by(0.05, { position: v3(7, 0, 0) }, { easing: easing.linear })
            .by(0.06, { position: v3(4, 0, 0) }, { easing: easing.linear })
            .by(0.07, { position: v3(-4, 0, 0) }, { easing: easing.linear })
            .by(0.08, { position: v3(-3, 0, 0) }, { easing: easing.linear })
            .by(0.09, { position: v3(3, 0, 0) }, { easing: easing.linear })
            .by(0.1, { position: v3(2, 0, 0) }, { easing: easing.linear })
            .by(0.11, { position: v3(-2, 0, 0) }, { easing: easing.linear })
            .call(() => {
                this.node.position = targetPosition;
            })
            .start();
    }

    playPickup() {
        this.node.setSiblingIndex(this.node.parent!.children.length);
        Tween.stopAllByTarget(this.node);
        const randomScaleX = 0.08 + 0.08 * Math.random();
        const randomScaleY = 0.08 + 0.08 * Math.random();
        const targetScale = 1.4 * this._viewScale;
        this.playTileEffect();
        const duration = 0.15;
        tween(this.node)
            .to(duration, { scale: v3(targetScale, targetScale, 1) }, { easing: easing.backOut })
            .to(0.105, { scale: v3(targetScale - randomScaleX, targetScale + randomScaleY, 1) })
            .to(0.075, { scale: v3(targetScale + randomScaleX, targetScale - randomScaleY, 1) })
            .to(0.045, { scale: v3(targetScale, targetScale, 1) })
            .call(() => {
                tween(this.node)
                    .parallel(
                        tween().by(0.9, { angle: -5 }, { easing: easing.sineOut }).delay(0.2).by(1.8, { angle: 10 }, { easing: easing.sineInOut }).delay(0.2).by(0.9, { angle: -5 }, { easing: easing.sineIn }),
                        tween().by(2, { position: v3(0, -12, 0) }, { easing: easing.sineInOut }).by(2, { position: v3(0, 12, 0) }, { easing: easing.sineInOut })
                    )
                    .union()
                    .repeatForever()
                    .start();
            })
            .start();
    }

    playPutdown() {
        const tilePos = this.tilePos!;
        const targetPosition = v3(tilePos.x * TILE_SIZE * this._viewScale, tilePos.y * TILE_SIZE * this._viewScale, 0);
        const randomScaleX = this._viewScale + (0.6 * Math.random() - 0.3);
        const randomScaleY = 1.12 * this._viewScale + (0.6 * Math.random() - 0.3);
        const targetScale = new Vec3(this._viewScale, this._viewScale, 1);
        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(0.1, { position: targetPosition, scale: targetScale, angle: 0 })
            .call(() => {
                const index = this.calcIndex();
                this.node.setSiblingIndex(index);
            })
            .to(0.08, { scale: v3(randomScaleX, randomScaleY, 1) })
            .to(0.05, { scale: targetScale })
            .start();
    }

    playCollect(targetPosition: Vec3, callback?: Function) {
        Tween.stopAllByTarget(this.node);
        this.setColor(Color.WHITE);
        const duration = 0.135;
        const randomDirection = Math.random() > 0.5 ? 1 : -1;
        tween(this.node)
            .parallel(
                tween().to(duration, { position: targetPosition }, { easing: easing.quartOut }),
                tween().to(0.4 * duration, { scale: Vec3.ONE }, { easing: easing.smooth }),
                tween().to(0.04725, { angle: 15 * randomDirection }).delay(0.081).to(0.02025, { angle: 0 })
            )
            .call(() => {
                this.node.position = targetPosition;
                if (callback) callback();
            })
            .to(0.035, { angle: -3 * randomDirection })
            .to(0.06, { angle: 3 * randomDirection })
            .to(0.025, { angle: -1 * randomDirection })
            .to(0.02, { angle: 1 * randomDirection })
            .to(0.01, { angle: 0 })
            .start();
        this.emit(TILE_EVENT.Collect, this);
    }

    playRemove(delay: number = 0, callback?: Function) {
        Tween.stopAllByTarget(this.node);
        this.node.angle = 0;
        tween(this.node)
            .delay(delay)
            .to(0.16, { scale: Vec3.ZERO }, { easing: easing.backIn })
            .call(() => {
                if (callback) callback();
            })
            .start();
        if (this.pre) this.pre.next = this.next;
        if (this.next) this.next.pre = this.pre;
        this.emit(TILE_EVENT.Remove, this);
    }

    playShakeRemove() {
        Tween.stopAllByTarget(this.node);
        this.node.angle = 0;
        const targetScale = 1.2 * this._viewScale;
        tween(this.node)
            .to(0.08, { scale: v3(targetScale, targetScale, targetScale) })
            .to(0.03, { angle: -5 }, { easing: easing.sineOut })
            .to(0.06, { angle: 5 }, { easing: easing.sineInOut })
            .to(0.06, { angle: -5 }, { easing: easing.sineIn })
            .to(0.03, { angle: 0 }, { easing: easing.sineOut })
            .call(() => {
                this.playRemove();
            })
            .start();
    }

    playLight() {
        if (this.lightEff) {
            const skeleton = this.lightEff.getComponent(sp.Skeleton);
            skeleton!.clearTracks();
            skeleton!.setAnimation(0, 'lightning', false);
            return;
        }
        const effectLight = AssetPool.Instance.createObject(GamePrefabs.EffectLight.url);
        effectLight.parent = this.node.parent;
        effectLight.position = this.node.position;
        effectLight.setScale(this.node.scale);
        const skeleton = effectLight.getComponent(sp.Skeleton);
        skeleton!.setCompleteListener(() => {
            this._beDelLightEff = true;
        });
        skeleton!.setAnimation(0, 'lightning', false);
        this.scheduleOnce(() => {
            this.refreshView();
        }, 0.2);
        this.lightEff = effectLight;
    }

    playSuperLight(targetPosition: Vec3, duration: number) {
        const worldPosition = this.node.worldPosition;
        const midPoint = new Vec3(worldPosition).lerp(targetPosition, 0.5);
        const direction = new Vec2(targetPosition.x, targetPosition.y).subtract2f(worldPosition.x, worldPosition.y);
        if (this.state === TileStatus.Gray) {
            this._state = TileStatus.Light;
            this.refreshStatus();
        }
        this.node.setSiblingIndex(this.node.parent!.children.length);
        const wandLight = AssetPool.Instance.createObject(GamePrefabs.WandLight.url);
        wandLight.parent = MgrUi.root(1);
        wandLight.worldPosition = midPoint;
        wandLight.angle = misc.radiansToDegrees(Vec2.UNIT_X.signAngle(direction));
        wandLight.setSiblingIndex(wandLight.parent!.children.length - 2);
        const scale = direction.length() / wandLight.getComponent(UITransform)!.width;
        wandLight.scale = new Vec3(scale, 1, 1);
        const wandEliminateTile = AssetPool.Instance.createObject(GamePrefabs.WandEliminateTile.url);
        wandEliminateTile.parent = MgrUi.root(1);
        wandEliminateTile.worldPosition = this.node.worldPosition;
        wandEliminateTile.setSiblingIndex(wandLight.parent!.children.length - 2);
        const skeleton = wandEliminateTile.getComponent(sp.Skeleton);
        skeleton!.timeScale = 1.2;
        skeleton!.setAnimation(0, 'eliminate', false);
        skeleton!.setCompleteListener(() => {
            skeleton!.setCompleteListener(null);
            AssetPool.Instance.put(wandEliminateTile);
        });
        this.scheduleOnce(() => {
            AssetPool.Instance.put(wandLight);
            this.Recycle();
        }, duration);
    }

    onTouchStart() {
        if (this.delegate.touchTileEnable) {
            switch (this.state) {
                case TileStatus.Gray:
                    this.playShake();
                    break;
                case TileStatus.Light:
                    this._touched = true;
                    this.playPickup();
                    break;
            }
        }
    }

    onTouchCancel() {
        if (this._touched) {
            this._touched = false;
            this.playPutdown();
        }
    }

    onTouchEnd() {
        if (this._touched) {
            this._touched = false;
            this.emit(TILE_EVENT.Click, this);
        }
    }

    CollectEnable() {
        return this._parentList.length === 0;
    }

    addParent(parent: GameTile) {
        parent.once(TILE_EVENT.Collect, this._parentCollectEvent, this);
        this._parentList.push(parent);
    }

    private _removeParent(parent: GameTile) {
        const index = this._parentList.indexOf(parent);
        if (index >= 0) {
            parent.targetOff(this);
            pullAt(this._parentList, [index]);
        }
    }

    private _parentCollectEvent(parent: GameTile) {
        this._removeParent(parent);
        if (this._parentList.length === 0) {
            if (this.state === TileStatus.Remove) {
                console.error('移除父节点时，子节点状态为移除！！');
                return;
            }
            this.state = TileStatus.Light;
        }
    }

    addChild(child: GameTile) {
        child.once(TILE_EVENT.Remove, this._childRemoveEvent, this);
        this._childList.push(child);
    }

    private _childRemoveEvent(child: GameTile) {
        const index = this._childList.indexOf(child);
        if (index >= 0) {
            child.targetOff(this);
            child._removeParent(this);
            pullAt(this._childList, [index]);
        }
    }

    getChildren() {
        return this._childList;
    }

    clear() {
        this._attachId = -1;
        this._tIdx = -1;
        this._state = TileStatus.Init;
        this.pre = null;
        this.next = null;
        this._parentList.length = 0;
        this._childList.length = 0;
        this.clearEvents();
    }

    Recycle() {
        this.clear();
        this.removeTileEffect();
        this.removeLightEffect();
        AssetPool.Instance.put(this);
    }

    isOverlap(other: GameTile) {
        const x1 = this.tilePos!.x;
        const y1 = this.tilePos!.y;
        const x2 = other.tilePos!.x;
        const y2 = other.tilePos!.y;
        return Math.abs(x1 - x2) < 1 && Math.abs(y1 - y2) < 1;
    }

    lateUpdate(dt: number) {
        if (this._beDelTileEff) {
            this._beDelTileEff = false;
            this.removeTileEffect();
        }
        if (this._beDelLightEff) {
            this._beDelLightEff = false;
            this.removeLightEffect();
        }
    }

    get index() {
        return this._idx;
    }

    set index(value: number) {
        this._idx = value;
    }

    get tIdx() {
        return this._tIdx;
    }

    set tIdx(value: number) {
        if (this._tIdx !== value) {
            this._tIdx = value;
            this.refreshView();
            this.emit(TILE_EVENT.ChangeTileId, this);
        }
    }

    get layer() {
        return this._layer;
    }

    set layer(value: number) {
        this._layer = value;
    }

    get tilePos() {
        return this._tilePos;
    }

    set tilePos(value: Vec2 | null) {
        this._tilePos = value;
    }

    get attachId() {
        return this._attachId;
    }

    set attachId(value: number) {
        this._attachId = value;
        this.refreshAttachView();
        this.emit(TILE_EVENT.ChangeAttach, this);
    }

    get state() {
        return this._state;
    }

    set state(value: TileStatus) {
        if (this._state !== value) {
            this._state = value;
            this.refreshStatus();
            this.emit(TILE_EVENT.ChangeStatus, this);
        }
    }

    get pre() {
        return this._pre;
    }

    set pre(value: GameTile | null) {
        this._pre = value;
    }

    get next() {
        return this._next;
    }

    set next(value: GameTile | null) {
        this._next = value;
    }
}