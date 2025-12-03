import { _decorator, UIOpacity, tween, easing, Vec3, Tween, cclegacy } from 'cc';
import { WinStreakHelpView } from './WinStreakHelpView';

const { ccclass, property } = _decorator;

const ANIMATION_DURATION = 0.24;

@ccclass('BonusWandRule')
export class BonusWandRule extends WinStreakHelpView {
    @property(UIOpacity)
    public more: UIOpacity = null!;

    protected _runHelpStep(): void {
        super._runHelpStep();
        
        this._taskAsync.push((completeCallback: Function) => {
            tween(this.more)
                .to(ANIMATION_DURATION, { opacity: 255 }, { easing: easing.backOut })
                .start();
                
            tween(this.more.node)
                .to(ANIMATION_DURATION, { scale: Vec3.ONE }, { easing: easing.backOut })
                .start();
                
            this.scheduleOnce(completeCallback, ANIMATION_DURATION + 0.1);
        });
    }

    protected _resetStep(): void {
        super._resetStep();
        
        Tween.stopAllByTarget(this.more);
        this.more.node.scale = Vec3.ZERO;
        this.more.opacity = 0;
    }
}