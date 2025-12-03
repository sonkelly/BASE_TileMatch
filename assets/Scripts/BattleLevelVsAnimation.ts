import { _decorator, Component, Animation, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BattleLevelVsAnimation')
export class BattleLevelVsAnimation extends Component {
    @property(Animation)
    public animation: Animation | null = null;

    private _delegate: any = null;

    public set delegate(value: any) {
        this._delegate = value;
    }

    onEnable() {
        this._playVsAnimation();
    }

    private _playVsAnimation() {
        if (!this.animation || !this.animation.defaultClip) return;
        
        this.animation.defaultClip.events = [{
            frame: 1.43,
            func: 'onTriggered',
            params: []
        }];
        
        this.animation.clips = this.animation.clips;
        this.animation.play('BattleVsAnimation');
    }

    private onTriggered() {
        if (this._delegate) {
            this._delegate.runMaskAnimation();
        }
    }
}