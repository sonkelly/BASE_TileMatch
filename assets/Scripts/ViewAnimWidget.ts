import { _decorator, CCBoolean, Enum, CCInteger, Vec3, UITransform, tween, easing, Tween, CCFloat } from 'cc';
import { Direction } from './Const';
import {ViewAnimBase} from './ViewAnimBase';

const { ccclass, menu, property, disallowMultiple } = _decorator;

@ccclass('ViewAnimWidget')
@menu('ViewAnim/ViewAnimWidget')
@disallowMultiple
export default class ViewAnimWidget extends ViewAnimBase {
    @property(CCBoolean)
    initOut: boolean = true;

    @property({ type: Enum(Direction) })
    dir: Direction = Direction.LEFT;

    @property(CCInteger)
    delayInDuration: number = 0;

    @property(CCInteger)
    delayOutDuration: number = 0;

    @property(CCBoolean)
    inEasing: boolean = false;

    private _tween: Tween<any> | undefined;
    private _originPosition: Vec3 = new Vec3();
    private _outPosition: Vec3 = new Vec3();

    initialize() {
        this.preCreate();
        this.lateCreate();
    }

    preCreate() {
        this._originPosition.set(this.node.position.x, this.node.position.y, this.node.position.z);
        this._outPosition.set(this.node.position.x, this.node.position.y, this.node.position.z);
        
        const width = this.getComponent(UITransform)!.width;
        const height = this.getComponent(UITransform)!.height;

        switch (this.dir) {
            case Direction.LEFT:
                this._outPosition.subtract3f(width, 0, 0);
                break;
            case Direction.RIGHT:
                this._outPosition.add3f(width, 0, 0);
                break;
            case Direction.TOP:
                this._outPosition.add3f(0, height, 0);
                break;
            case Direction.BOTTOM:
                this._outPosition.subtract3f(0, height, 0);
                break;
        }
    }

    lateCreate() {
        if (this.initOut) {
            this.node.position = this._outPosition;
        }
    }

    createInAction(duration: number): Tween<any> {
        if (this.inEasing) {
            return tween()
                .set({ position: this._outPosition })
                .delay(this.delayInDuration)
                .to(duration, { position: this._originPosition }, { easing: easing.backOut });
        } else {
            return tween()
                .set({ position: this._outPosition })
                .delay(this.delayInDuration)
                .to(duration, { position: this._originPosition }, { easing: easing.quartOut });
        }
    }

    createOutAction(duration: number): Tween<any> {
        return tween()
            .delay(this.delayOutDuration)
            .to(duration, { position: this._outPosition });
    }

    runInAction(duration: number) {
        Tween.stopAllByTarget(this.node);
        this._tween = tween(this.node)
            .then(this.createInAction(duration))
            .call(() => {
                this.node.emit('widget-anim-in-done');
            })
            .start();
    }

    runOutAction(duration: number) {
        Tween.stopAllByTarget(this.node);
        this._tween = tween(this.node)
            .then(this.createOutAction(duration))
            .start();
    }
}