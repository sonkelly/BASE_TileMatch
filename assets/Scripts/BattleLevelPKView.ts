import { _decorator, Component, Sprite, UIOpacity, Tween, tween, easing, cclegacy } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { BattleLevelVsAnimation } from './BattleLevelVsAnimation';
import { AppGame } from './AppGame';
import { MgrBattleLevel } from './MgrBattleLevel';

const { ccclass, property } = _decorator;

@ccclass('BattleLevelPKView')
export class BattleLevelPKView extends Component {
    @property(Sprite)
    headSpMe: Sprite | null = null;

    @property(Sprite)
    headSpOther: Sprite | null = null;

    @property(UIOpacity)
    maskOpacity: UIOpacity | null = null;

    @property(BattleLevelVsAnimation)
    vsAnimation: BattleLevelVsAnimation | null = null;

    protected onLoad(): void {
        if (this.vsAnimation) {
            this.vsAnimation.delegate = this;
        }
    }

    protected onEnable(): void {
        if (this.maskOpacity) {
            this.maskOpacity.opacity = 220;
        }
        MgrBattleLevel.Instance.initBattleLevelHeads(this.headSpMe, this.headSpOther);
    }

    public runMaskAnimation(): void {
        if (!this.maskOpacity) return;

        Tween.stopAllByTarget(this.maskOpacity);
        tween(this.maskOpacity)
            .to(0.4, { opacity: 0 }, { easing: easing.sineInOut })
            .call(() => {
                this._afterRunMaskAnimation();
            })
            .start();
    }

    private _afterRunMaskAnimation(): void {
        AppGame.topUI.battleLevelTop.runVsAnimation();
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }
}