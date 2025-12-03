import { _decorator, Component, Node, tween, Vec3, CCObject } from 'cc';
import {ViewAnimBase} from './ViewAnimBase';

const { ccclass, property, menu } = _decorator;

@ccclass('ViewAnimScale')
@menu('ViewAnim/ViewAnimScale')
export default class ViewAnimScale extends ViewAnimBase {
    private _originScale: number = 0;
    private tween: any;
    private _v3To1: Vec3 = new Vec3();
    private _v3To2: Vec3 = new Vec3();

    initialize() {
        this._originScale = this.node.getScale().x;
    }

    runInAction(duration: number) {
        if (this.tween) {
            this.tween.stop();
        }
        
        this.node.active = true;
        this.node.setScale(0, 0, 0);
        this._v3To1.set(1.15, 1.15, 1.15);
        this._v3To2.set(this._originScale, this._originScale, this._originScale);
        
        this.tween = tween(this.node)
            .to(0.6 * duration, { scale: this._v3To1 })
            .to(0.4 * duration, { scale: this._v3To2 })
            .start();
    }

    runOutAction(duration: number) {
        if (this.tween) {
            this.tween.stop();
        }
        
        this.tween = tween(this.node)
            .to(duration, { scale: Vec3.ZERO })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }
}