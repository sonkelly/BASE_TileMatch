import { _decorator, Component, Sprite, sp, ParticleSystem2D, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { SdkBridge } from './SdkBridge';
import { UIUtil } from './UIUtil';

const { ccclass, property } = _decorator;

@ccclass('BattleLevelWinView')
export class BattleLevelWinView extends Component {
    @property(Sprite)
    headSp: Sprite | null = null;

    @property(sp.Skeleton)
    winSpine: sp.Skeleton | null = null;

    @property(ParticleSystem2D)
    particle: ParticleSystem2D | null = null;

    onEnable() {
        UIUtil.loadHead(SdkBridge.getPlayerPhotoUrl(), this.headSp);
        this._playSpine();
    }

    private _playSpine() {
        const self = this;
        this.winSpine?.clearAnimations();
        this.winSpine?.setAnimation(0, 'win', false);
        this.winSpine?.setCompleteListener(() => {
            this.winSpine?.setCompleteListener(null);
            this.node.getComponent(ViewAnimCtrl)?.onClose();
        });
    }

    private _playParticle() {
        const self = this;
        if (this.particle) {
            this.particle.node.active = true;
            this.particle.resetSystem();
            this.scheduleOnce(() => {
                this.node.getComponent(ViewAnimCtrl)?.onClose();
            }, this.particle.life);
        }
    }
}