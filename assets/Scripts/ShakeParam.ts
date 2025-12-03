import { _decorator, Component, Camera, v3, math, js } from 'cc';
import { AppGame } from './AppGame';

const { ccclass, property, executeInEditMode } = _decorator;

export class ShakeParams {
    @property({ displayName: '最大震动数' })
    numberOfShakes: number = 2;

    @property({ displayName: '震动距离' })
    shakeAmount = v3(1, 1, 1);

    @property({ displayName: '距离' })
    distance: number = 10;

    @property({ displayName: '速度' })
    speed: number = 100;

    @property({ 
        displayName: '衰减幅度',
        range: [0.1, 1],
        slide: true 
    })
    decay: number = 0.2;

    @property({ displayName: '随机方向' })
    randomSign: boolean = true;

    onShakeStartEvent?: Function;
    onShakeCompleteEvent?: Function;

    copy(other: ShakeParams): this {
        for (const key in other) {
            (this as any)[key] = other[key];
        }
        return this;
    }
}

class ShakeState {
    timer: number = 0;
    startPosition = v3();
    shakePosition = v3();
    seed = v3(1, 1, 0);
    shakeParam: ShakeParams | null = null;

    constructor(position: any, param: ShakeParams) {
        this.startPosition = v3(position);
        this.shakeParam = param;
        
        if (param.randomSign) {
            this.seed.x = Math.random() > 0.5 ? -1 : 1;
            this.seed.y = Math.random() > 0.5 ? -1 : 1;
        }
    }
}

@ccclass('ShakeParam')
@executeInEditMode
export class ShakeParam extends Component {
    static instance: ShakeParam | null = null;

    @property(Camera)
    camera: Camera | null = null;

    @property(ShakeParams)
    shakeParam: ShakeParams = new ShakeParams();

    private _isShaking: boolean = false;
    private _isCancelling: boolean = false;
    private stateList: ShakeState[] = [];
    private shakeParams: ShakeParams | null = null;

    onLoad() {
        const params = new ShakeParams();
        params.numberOfShakes = 20;
        params.shakeAmount = v3(0.3, 0.8, 0);
        params.distance = 10;
        params.speed = 60;
        params.decay = 0.6;
        params.randomSign = true;
        
        this.shakeParams = params;
        ShakeParam.instance = this;
    }

    start() {
        if (!this.camera) {
            this.camera = this.node.getComponent(Camera);
        }
    }

    lateUpdate(dt: number) {
        if (!AppGame.gameUI.PauseStatus && this._isShaking) {
            for (let i = this.stateList.length; i--;) {
                const state = this.stateList[i];
                this.updateShake(dt, state);
            }
        }
    }

    private updateShake(dt: number, state: ShakeState) {
        const param = state.shakeParam!;
        state.timer += dt;
        const angle = state.timer * param.speed;

        state.shakePosition = v3(
            state.seed.x * Math.sin(angle) * (param.shakeAmount.x * param.distance),
            state.seed.y * Math.cos(angle) * (param.shakeAmount.y * param.distance),
            0
        );

        if (this.isCancelling) {
            param.distance -= param.decay * dt;
            if (param.distance <= 0) {
                this._isCancelling = false;
                param.numberOfShakes = 0;
            }
        } else if (angle > 2 * Math.PI) {
            state.timer = 0;
            param.distance *= 1 - math.clamp01(param.decay);
            param.numberOfShakes--;
        }

        this.camera!.node.position = this.camera!.node.position.add(state.shakePosition);

        if (param.numberOfShakes === 0) {
            param.onShakeCompleteEvent?.();
            js.array.remove(this.stateList, state);
            
            if (this.stateList.length === 0) {
                this._isShaking = false;
            }
        }
    }

    doShake(params?: ShakeParams) {
        if (!this.isCancelling) {
            this._isShaking = true;
            const shakeParams = new ShakeParams();
            shakeParams.copy(params || this.shakeParam);
            this.stateList.push(new ShakeState(this.camera!.node.position, shakeParams));
        }
    }

    doCancelShake(time?: number) {
        time ? this._doCancelShakeByTime(time) : this._doCancelShakeImm();
    }

    private _doCancelShakeByTime(time: number) {
        if (this._isShaking && !this.isCancelling) {
            this._isCancelling = true;
            for (let i = this.stateList.length; i--;) {
                const param = this.stateList[i].shakeParam!;
                param.decay = param.distance / time;
            }
        }
    }

    private _doCancelShakeImm() {
        if (this._isShaking && !this.isCancelling) {
            this._isShaking = false;
            for (let i = this.stateList.length; i--;) {
                const state = this.stateList[i];
                this.camera!.node.position = this.camera!.node.position.subtract(state.shakePosition);
            }
            this.stateList.length = 0;
        }
    }

    get isShaking(): boolean {
        return this._isShaking;
    }

    get isCancelling(): boolean {
        return this._isCancelling;
    }

    static shake() {
        const instance = ShakeParam.instance;
        instance?.doShake(instance.shakeParams);
    }

    static cancelShake(time?: number) {
        const instance = ShakeParam.instance;
        instance?.doCancelShake(time);
    }
}