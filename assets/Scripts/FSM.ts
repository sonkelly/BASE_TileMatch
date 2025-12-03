import { _decorator, Component, error, macro } from 'cc';
import { isNil } from 'lodash-es';
import { AppGame } from './AppGame';

const { ccclass } = _decorator;

export interface IFSMState {
    id: string;
    onEnter?(params?: any): void;
    onExit?(): void;
    onUpdate?(dt: number): void;
}

@ccclass('FSM')
export default class FSM extends Component {
    public nextState: string | null = null;
    public nextStateParams: any = null;
    protected curr: IFSMState | null = null;
    protected prev: IFSMState | null = null;
    protected _target: any = null;
    protected timeElapsed: number = 0;
    protected states: Record<string, IFSMState> = {};
    protected _fsmName: string = '';
    protected _isPaused: boolean = false;
    protected _running: boolean = true;

    get target() {
        return this._target;
    }

    clear() {
        this.nextState = null;
        this.nextStateParams = null;
    }

    pause() {
        this._isPaused = true;
    }

    resume() {
        this._isPaused = false;
    }

    setRunning(r: boolean) {
        this._running = r;
    }

    getRunning() {
        return this._running;
    }

    init(target: any) {
        this._target = target;
        this.timeElapsed = 0;
    }

    getState(id: string) {
        return this.states[id];
    }

    getCurrState() {
        return this.curr;
    }

    getPrevState() {
        return this.prev;
    }

    addState(state: IFSMState, fsmName: string) {
        this.states[state.id] = state;
        this._fsmName = fsmName;
    }

    enterState(stateId: string, params?: any) {
        this.timeElapsed = 0;
        const s = this.states[stateId];
        this.curr = s;
        this.nextState = s?.id ?? null;
        s?.onEnter?.(params);
    }

    resetCurrState() {
        this.timeElapsed = 0;
        this.curr?.onExit?.();
        this.curr?.onEnter?.();
    }

    changeState(stateId: string, params?: any) {
        const s = this.states[stateId];
        if (isNil(s)) {
            console.warn('[FSM] invalid state for stateId: ' + stateId + ' of : ' + (this._target && this._target.__classname__));
            return;
        }

        if (!this.curr) {
            error('curr state is nil!!', stateId, this.curr);
        }

        if (stateId !== this.curr?.id) {
            this.timeElapsed = 0;
            this.curr?.onExit?.();
            this.prev = this.curr;
            this.nextState = s.id;
            this.curr = s;
            this.curr.onEnter?.(params);
        }
    }

    changeNextState(stateId: string | null, params?: any) {
        this.nextState = stateId;
        this.nextStateParams = params;
    }

    revertState() {
        if (this.prev) {
            this.changeState(this.prev.id);
        }
    }

    isInState(stateId: string) {
        return this.curr === this.states[stateId] || this.nextState === stateId;
    }

    onEnable() {
        // schedule fixedUpdate at 1/30s interval, repeat forever, random initial delay in [0, 1/30)
        this.schedule(this.fixedUpdate.bind(this), 1 / 30, macro.REPEAT_FOREVER, Math.random() / 30);
    }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    fixedUpdate(dt: number) {
        if (!this._running) return;
        if (this._isPaused) return;

        dt *= (AppGame as any).globalSpeed;

        // original logic: if dt > 0.2 then dt = 0.04
        if (dt > 0.2) {
            dt = 0.04;
        }

        let proceed = false;
        if (isNil(this.nextState) || this.nextState === this.curr?.id) {
            proceed = true;
        } else {
            // attempt to change to nextState, then proceed only if still running
            this.changeState(this.nextState as string, this.nextStateParams);
            proceed = this._running;
        }

        if (proceed) {
            this.timeElapsed += dt;
            this.curr?.onUpdate?.(dt);
        }
    }
}