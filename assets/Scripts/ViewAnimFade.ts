import { _decorator, UIOpacity, tween, CCObject } from 'cc';
import {ViewAnimBase} from './ViewAnimBase';

const { ccclass, property, menu } = _decorator;

@ccclass('ViewAnimFade')
@menu('ViewAnim/ViewAnimFade')
export default class ViewAnimFade extends ViewAnimBase {
    private opacity: UIOpacity = null!;
    private _originOpacity: number = null!;
    private tween: any = undefined;

    protected initialize(): void {
        this.opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        this._originOpacity = this.opacity.opacity;
    }

    protected runInAction(duration: number): void {
        if (this.tween) this.tween.stop();
        
        this.node.active = true;
        this.opacity.opacity = 0;
        
        this.tween = tween(this.opacity)
            .to(duration, { opacity: this._originOpacity })
            .start();
    }

    protected runOutAction(duration: number): void {
        if (this.tween) this.tween.stop();
        
        this.tween = tween(this.opacity)
            .to(duration, { opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }
}