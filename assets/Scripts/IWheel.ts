import { _decorator, Component, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

export enum WheelState {
    IDLE = 0,
    READY = 1,
    STARTUP = 2,
    RUNNING = 3,
    CATCH_SUB = 4,
    SUB_SPEED = 5,
    CATCH_RESULT = 6,
    BACK = 7,
    STOP = 8
}

@ccclass('IWheel')
export class IWheel extends Component {
    @property({
        displayName: '转盘结果数'
    })
    displayCount: number = 8;

    @property({
        displayName: '加速时间'
    })
    addSpeedTime: number = 0.5;

    @property({
        displayName: '匀速时间'
    })
    runningTime: number = 1.5;

    @property({
        displayName: '减速时间'
    })
    subSpeedTime: number = 1.8;

    @property({
        displayName: '转动最大速度'
    })
    maxSpeed: number = 1600;

    @property({
        displayName: '转动最小速度'
    })
    minSpeed: number = 40;

    @property({
        displayName: '回弹角度'
    })
    backAngle: number = 0;

    @property({
        displayName: '回弹时间'
    })
    backTime: number = 0;

    private state: WheelState = WheelState.IDLE;
    private stateTime: number = 0;
    private speed: number = 0;
    private running: boolean = false;
    private intervalAngle: number = 0;
    private _beStop: boolean = true;
    private _result: number = -1;
    private _resultAngle: number = 0;
    private _backAngle: number = 0;
    private _startSubAngle: number = 0;
    private acceleration: number = 0;
    private runningAngle: number = 0;

    public play(): void {
        this.intervalAngle = 360 / this.displayCount;
        this._beStop = false;
        this.enterStartUp();
    }

    public setResult(result: number): void {
        this._result = result;
        this._resultAngle = this.intervalAngle * result;
        this._backAngle = this._resultAngle + this.backAngle;
        if (this._resultAngle === 0) {
            this._resultAngle = 360;
        }
        this._beStop = true;
    }

    public getSpeedRatio(): number {
        return this.speed / this.maxSpeed;
    }

    public hasResult(): boolean {
        return this._beStop;
    }

    public initToResult(result: number): void {
        this._result = result;
        this.refresh(this._result * this.intervalAngle);
    }

    protected lateUpdate(dt: number): void {
        if (this.running) {
            this.stateTime += dt;
            
            switch (this.state) {
                case WheelState.STARTUP:
                    this.speed += dt * this.acceleration;
                    if (this.stateTime >= this.addSpeedTime) {
                        this.enterRunningState();
                    }
                    break;
                case WheelState.RUNNING:
                    if (this.stateTime >= this.runningTime && this._beStop) {
                        this.enterCatchSub();
                    }
                    break;
                case WheelState.CATCH_SUB:
                    const currentAngle = this.runningAngle % 360;
                    const nextAngle = currentAngle + this.speed * dt;
                    
                    if ((currentAngle < this._startSubAngle && nextAngle >= this._startSubAngle) ||
                        (nextAngle > 360 && nextAngle % 360 >= this._startSubAngle)) {
                        this.enterSubSpeed();
                    }
                    break;
                case WheelState.SUB_SPEED:
                    this.speed += this.acceleration * dt;
                    if (this.stateTime >= this.subSpeedTime) {
                        this.enterCatchResult();
                    }
                    break;
                case WheelState.CATCH_RESULT:
                    const currentAngle2 = this.runningAngle % 360;
                    const nextAngle2 = currentAngle2 + this.speed * dt;
                    
                    if ((currentAngle2 < this._backAngle && nextAngle2 >= this._backAngle) ||
                        (nextAngle2 > 360 && nextAngle2 % 360 >= this._backAngle)) {
                        this.enterBack();
                    }
                    break;
                case WheelState.BACK:
                    if (this.stateTime >= this.backTime) {
                        this.enterStop();
                    }
                    break;
            }

            this.runningAngle += this.speed * dt;
            this.refresh(this.runningAngle);
        }
    }

    private enterStartUp(): void {
        this.running = true;
        this.state = WheelState.STARTUP;
        this.speed = 0;
        this.stateTime = 0;
        this.acceleration = this.maxSpeed / this.addSpeedTime;
        this.runningAngle = 0;
        this.onStartup();
        
        if (this.runningAngle === null) {
            console.error('在方法 [onEnterStartup] 中初始化 runningAngle!');
        }
    }

    private enterRunningState(): void {
        this.speed = this.maxSpeed;
        this.stateTime = 0;
        this.state = WheelState.RUNNING;
    }

    private enterCatchSub(): void {
        const acceleration = (this.minSpeed - this.maxSpeed) / this.subSpeedTime;
        const time = this.subSpeedTime;
        let distance = this.maxSpeed * time + 0.5 * acceleration * time * time;
        
        distance %= 360;
        if (distance < 0) distance += 360;
        
        this._startSubAngle = this._backAngle - distance;
        if (this._startSubAngle <= 0) {
            this._startSubAngle += 360;
        }
        
        this.state = WheelState.CATCH_SUB;
    }

    private enterSubSpeed(): void {
        this.acceleration = (this.minSpeed - this.maxSpeed) / this.subSpeedTime;
        this.stateTime = 0;
        this.runningAngle = this._startSubAngle;
        this.refresh(this.runningAngle);
        this.speed = this.maxSpeed;
        this.state = WheelState.SUB_SPEED;
    }

    private enterCatchResult(): void {
        this.state = WheelState.CATCH_RESULT;
        this.speed = this.minSpeed;
    }

    private enterBack(): void {
        if (this.backAngle <= 0 || this.backTime <= 0) {
            this.enterStop();
        } else {
            this.state = WheelState.BACK;
            this.stateTime = 0;
            this.speed = -this.backAngle / this.backTime;
            this.onEnterBack();
        }
    }

    private enterStop(): void {
        this.state = WheelState.STOP;
        this.speed = 0;
        this.runningAngle = this._resultAngle;
        this.running = false;
        this.refresh(this.runningAngle);
        this.onRunDone(this._result, () => {
            this.state = WheelState.IDLE;
        });
    }

    protected refresh(angle: number): void {
        // 实现角度刷新逻辑
    }

    protected onStartup(): void {
        // 启动时的回调
    }

    protected onEnterBack(): void {
        // 进入回弹状态时的回调
    }

    protected onRunDone(result: number, callback: () => void): void {
        // 运行完成时的回调
        callback();
    }
}