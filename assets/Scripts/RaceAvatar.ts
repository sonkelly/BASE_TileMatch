import { _decorator, Component, Sprite, SpriteFrame, Animation, cclegacy } from 'cc';
import { AvatarCfg } from './AvatarCfg';
import { MgrUser } from './MgrUser';

const { ccclass, property } = _decorator;

enum AvatarState {
    Stop = 0,
    Stay = 1,
    Jump = 2
}

const RACE_STAY = 'raceStay';
const RACE_JUMP = 'raceJump';

@ccclass('RaceAvatar')
export class RaceAvatar extends Component {
    @property(Sprite)
    headBg: Sprite | null = null;

    @property(SpriteFrame)
    headBgSfOther: SpriteFrame | null = null;

    @property(SpriteFrame)
    headBgSfSelf: SpriteFrame | null = null;

    @property(Sprite)
    head: Sprite | null = null;

    @property(Animation)
    animation: Animation | null = null;

    private _playState: AvatarState = AvatarState.Stay;
    private _raceInfo: any = null;

    async updateHead(headId: string): Promise<void> {
        this.head!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(headId);
    }

    onEnable(): void {
        this.animation!.on(Animation.EventType.FINISHED, this._onAnimationEvent, this);
        this.scheduleOnce(() => {
            if (this._playState === AvatarState.Stay) {
                this.animation!.play(RACE_STAY);
            }
        }, Math.random());
    }

    onDisable(): void {
        this.animation!.off(Animation.EventType.FINISHED, this._onAnimationEvent, this);
        this.animation!.stop();
        this.unscheduleAllCallbacks();
        this._playState = AvatarState.Stay;
    }

    private _onAnimationEvent(type: Animation.EventType, event: any): void {
        if (type === Animation.EventType.FINISHED && event.name === RACE_JUMP) {
            this._playState = AvatarState.Stay;
            this.animation!.play(RACE_STAY);
        }
    }

    stopAnimation(): void {
        this._playState = AvatarState.Stop;
        this.animation!.stop();
    }

    playJump(): void {
        this._playState = AvatarState.Jump;
        this.animation!.play(RACE_JUMP);
    }

    get raceInfo(): any {
        return this._raceInfo;
    }

    set raceInfo(value: any) {
        this._raceInfo = value;
        if (this._raceInfo.me) {
            this.updateHead(MgrUser.Instance.userData.userHead);
            this.headBg!.spriteFrame = this.headBgSfSelf;
        } else {
            this.updateHead(this._raceInfo.id);
            this.headBg!.spriteFrame = this.headBgSfOther;
        }
    }
}