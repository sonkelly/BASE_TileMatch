import { _decorator, Component, error, find, Node, CCObject } from 'cc';
import { Effect } from './Effect';
import { App } from './App';
import {pullAt, each} from 'lodash-es';

const { ccclass, property } = _decorator;

export enum POS_TYPE {
    Local = 1,
    World = 2
}

@ccclass('EffectMgr')
export class EffectMgr extends Component {
    private static _ins: EffectMgr = null;
    private _root: Node = null;
    private _pool: { [key: string]: Effect[] } = {};
    private _effects: Effect[] = [];

    public static get Instance(): EffectMgr {
        if (!this._ins) {
            this._ins = App.MyApp.node.addComponent(EffectMgr);
        }
        return this._ins;
    }

    public get worldRoot(): Node {
        if (!this._root) {
            this._root = find('Root3D');
        }
        return this._root;
    }

    public getEffObj(effectUrl: string): Effect {
        const pool = this._pool[effectUrl];
        return pool && pool.length > 0 ? pool.pop()! : new Effect(effectUrl);
    }

    public putEffObj(effect: Effect): void {
        effect.Recycle();
        const effectUrl = effect.effectUrl;
        const pool = this._pool[effectUrl];
        
        if (pool) {
            if (pool.indexOf(effect) < 0) {
                pool.push(effect);
            } else {
                error('已存在对象，不能重复放入缓存！！');
            }
        } else {
            this._pool[effectUrl] = [effect];
        }
    }

    public clear(): void {
        this.removeAll();
    }

    public removeAll(): void {
        each(this._effects, (effect: Effect) => {
            this.putEffObj(effect);
        });
        this._effects.length = 0;
    }

    public complete(effect: Effect): void {
        const index = this._effects.indexOf(effect);
        if (index >= 0) {
            pullAt(this._effects, [index]);
            this.putEffObj(effect);
        }
    }

    public playInWorld(effectUrl: string, position: any, rotation?: any, scale?: any, duration?: number): Effect {
        const effect = this.getEffObj(effectUrl);
        effect.play(position, POS_TYPE.World, this.worldRoot, rotation, scale, duration);
        effect.delegate = this;
        this._effects.push(effect);
        return effect;
    }

    public playInObj(effectUrl: string, target: Node, position?: any, rotation?: any, scale?: any, duration?: number): Effect {
        const effect = this.getEffObj(effectUrl);
        effect.play(position, POS_TYPE.Local, target, rotation, scale, duration);
        effect.delegate = this;
        this._effects.push(effect);
        return effect;
    }

    public playInObjWithLocalMove(effectUrl: string, target: Node, startPos: any, endPos: any, duration?: number, callback?: Function): Effect {
        const effect = this.getEffObj(effectUrl);
        effect.playWithLocalMove(target, startPos, endPos, duration, callback);
        effect.delegate = this;
        this._effects.push(effect);
        return effect;
    }

    public update(dt: number): void {
        if (this._effects.length > 0) {
            for (let i = this._effects.length - 1; i >= 0; i--) {
                this._effects[i].lifeUpdate(dt);
            }
        }
    }
}