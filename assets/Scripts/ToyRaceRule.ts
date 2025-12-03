import { _decorator, Component, Node, UIOpacity, tween, easing, Vec3, Tween, CCFloat } from 'cc';
import { WinStreakHelpView } from './WinStreakHelpView';

const { ccclass, property } = _decorator;

@ccclass('ToyRaceRule')
export class ToyRaceRule extends WinStreakHelpView {
    @property(UIOpacity)
    private more: UIOpacity | null = null;

    private readonly animationDuration: number = 0.24;

    protected _runHelpStep(): void {
        super._runHelpStep();
        
        this._taskAsync.push((done: Function) => {
            tween(this.more)
                .to(this.animationDuration, { opacity: 255 }, { easing: easing.backOut })
                .start();

            tween(this.more.node)
                .to(this.animationDuration, { scale: Vec3.ONE }, { easing: easing.backOut })
                .start();

            this.scheduleOnce(done, this.animationDuration + 0.1);
        });
    }

    protected _resetStep(): void {
        super._resetStep();
        
        Tween.stopAllByTarget(this.more);
        this.more.node.scale = Vec3.ZERO;
        this.more.opacity = 0;
    }
}