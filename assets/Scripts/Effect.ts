import { _decorator, GradientRange, Color, ParticleSystem, Vec3, tween, Tween, easing, Node } from 'cc';
import {AssetPool} from './AssetPool';
import { BUNDLE_NAMES } from './AssetRes';
import { POS_TYPE } from './EffectMgr';

const { ccclass } = _decorator;

enum EffectState {
    Idle = 0,
    Loading = 1,
    Playing = 2,
    Removed = 3,
}

export interface IEffectDelegate {
    complete(effect: Effect): void;
}

@ccclass('Effect')
export class Effect {
    private _lifeTime: number | null = null;
    private _effectUrl: string = '';
    private _position: Vec3 = new Vec3();
    private _posType: POS_TYPE | null = null;
    private _parent: Node | null = null;
    private _loop: boolean = false;
    private _runningTime: number = 0;
    private _state: EffectState = EffectState.Idle;
    private _effectNode: Node | null = null;
    private _color: string = '';
    private _delegate: IEffectDelegate | null = null;

    constructor(effectUrl = '') {
        this._effectUrl = effectUrl;
    }

    private _complete() {
        this._delegate && this._delegate.complete(this);
    }

    private _remove() {
        if (this._effectNode) {
            AssetPool.Instance.put(this._effectNode);
            this._effectNode = null;
        }
        this._parent = null;
    }

    play(position: Vec3, posType: POS_TYPE, parent: Node | null, lifeTime: number | null, loop: boolean, color = '') {
        this._position.set(position);
        this._posType = posType;
        this._lifeTime = lifeTime;
        this._parent = parent;
        this._loop = loop;
        this._runningTime = 0;
        this._color = color;
        this._load();
    }

    async playWithLocalMove(parent: Node | null, startPos: Vec3, toPos: Vec3, duration: number, callback?: () => void) {
        this._position.set(startPos);
        this._posType = POS_TYPE.Local;
        this._lifeTime = 0;
        this._parent = parent;
        this._loop = true;
        this._runningTime = 0;
        await this._load();
        if (this._state !== EffectState.Removed) {
            Tween.stopAllByTarget(this._effectNode as Node);
            tween(this._effectNode as Node)
                .to(duration, { position: toPos }, { easing: easing.smooth })
                .call(() => { callback && callback(); })
                .start();
        }
    }

    private async _load() {
        this._state = EffectState.Loading;
        this._effectNode = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, this._effectUrl);
        this._loaded();
    }

    private _loaded() {
        if (this._state === EffectState.Removed) {
            this._remove();
        } else {
            this._playEffect();
        }
    }

    private _playEffect() {
        this._state = EffectState.Playing;
        if (!this._effectNode) return;

        this._effectNode.parent = this._parent ?? undefined;
        if (this._posType === POS_TYPE.World) {
            this._effectNode.worldPosition = this._position;
        } else {
            this._effectNode.position = this._position;
        }

        let range: GradientRange | null = null;
        if (this._color) {
            range = new GradientRange();
            range.mode = GradientRange.Mode.Color;
            const c = new Color();
            c.fromHEX(this._color);
            range.color = c;
        }

        const systems = this._effectNode.getComponentsInChildren(ParticleSystem);
        systems.forEach((ps) => {
            if (range) ps.startColor = range;
            ps.stop();
            ps.play();
        });

        if (this._lifeTime == null) {
            this._lifeTime = 0;
            systems.forEach((ps) => {
                this._lifeTime = Math.max(ps.duration, this._lifeTime as number);
            });
        }
    }

    Recycle() {
        this._state = EffectState.Removed;
        this._remove();
    }

    lifeUpdate(dt: number) {
        if (this._loop) return;
        switch (this._state) {
            case EffectState.Playing:
                if (this._lifeTime && this._lifeTime > 0) {
                    this._runningTime += dt;
                    if (this._runningTime >= this._lifeTime) this._complete();
                }
                break;
        }
    }

    get effectUrl() {
        return this._effectUrl;
    }

    set delegate(d: IEffectDelegate | null) {
        this._delegate = d;
    }
}