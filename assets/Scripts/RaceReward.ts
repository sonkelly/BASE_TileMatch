import { _decorator, Component, Enum, sp } from 'cc';
const { ccclass, property } = _decorator;

enum RewardBoxIndex {
    None = 0,
    FIRST = 1,
    SECOND = 2,
    THIRD = 3
}

enum BoxState {
    None = 0,
    Wait = 1,
    Open = 2,
    Standby = 3
}

const waitAnimationsFirst = ['gift_03_loop', 'gift_03_loop', 'gift_03_loop', 'gift_03_loop', 'gift_03_loop', 'gift_03_collection'];
const waitAnimationsSecond = ['gift_02_loop', 'gift_02_loop', 'gift_02_loop', 'gift_02_loop', 'gift_02_collection'];
const waitAnimationsThird = ['gift_01_loop', 'gift_01_loop', 'gift_01_loop', 'gift_01_collection'];

@ccclass('RaceReward')
export class RaceReward extends Component {
    @property({ type: Enum(RewardBoxIndex) })
    rewardBoxIdx: RewardBoxIndex = RewardBoxIndex.None;

    @property(sp.Skeleton)
    levelBox: sp.Skeleton | null = null;

    private _waitAnimations: string[] = [];
    private _openAnimation: string = '';
    private _standbyAnimation: string = '';
    private _boxState: BoxState = BoxState.None;
    private _animationName: string = '';
    private _animationIndex: number = 0;
    private _delegate: any = null;

    onLoad() {
        switch (this.rewardBoxIdx) {
            case RewardBoxIndex.FIRST:
                this._waitAnimations = waitAnimationsFirst;
                this._openAnimation = 'gift_03_open';
                this._standbyAnimation = 'gift_03_standby';
                break;
            case RewardBoxIndex.SECOND:
                this._waitAnimations = waitAnimationsSecond;
                this._openAnimation = 'gift_02_open';
                this._standbyAnimation = 'gift_02_standby';
                break;
            case RewardBoxIndex.THIRD:
                this._waitAnimations = waitAnimationsThird;
                this._openAnimation = 'gift_01_open';
                this._standbyAnimation = 'gift_01_standby';
                break;
        }
    }

    onEnable() {
        this.levelBox?.setCompleteListener(() => {
            this._playAnimationComplete();
        });
    }

    onDisable() {
        this.levelBox?.clearAnimations();
    }

    setDelegate(delegate: any) {
        this._delegate = delegate;
    }

    private _playAnimationComplete() {
        if (this._boxState === BoxState.Wait) {
            this._playWaitComplete();
        } else if (this._boxState === BoxState.Open) {
            this._playBoxOpenComplete();
        }
    }

    initRewardState(state: any) {
        if (state && state.realStep === state.showStep) {
            this._playBoxStandby();
        } else {
            this._playBoxWait();
        }
    }

    private _playBoxWait() {
        this._boxState = BoxState.Wait;
        this._animationIndex = 0;
        const animationIndex = this._animationIndex % this._waitAnimations.length;
        this._animationName = this._waitAnimations[animationIndex];
        this.levelBox?.setAnimation(0, this._animationName, false);
    }

    private _playWaitComplete() {
        this._animationIndex++;
        const animationIndex = this._animationIndex % this._waitAnimations.length;
        this._animationName = this._waitAnimations[animationIndex];
        this.levelBox?.setAnimation(0, this._animationName, false);
    }

    private _playBoxStandby() {
        this._boxState = BoxState.Standby;
        this._animationName = this._standbyAnimation;
        this.levelBox?.setAnimation(0, this._animationName, true);
    }

    playBoxOpen() {
        this._boxState = BoxState.Open;
        this._animationName = this._openAnimation;
        this.levelBox?.setAnimation(0, this._animationName, false);
    }

    private _playBoxOpenComplete() {
        this._boxState = BoxState.Standby;
        this._animationName = this._standbyAnimation;
        this.levelBox?.setAnimation(0, this._animationName, true);
        this._delegate?.checkResult(this.rewardBoxIdx);
    }
}