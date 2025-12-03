import { _decorator, Component, director, macro, game, Game, cclegacy } from 'cc';
import { GlobalEvent } from './Events';

const { ccclass } = _decorator;

@ccclass('MgrBase')
export class MgrBase extends Component {
    async loadData(){
        await this.load();
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        director.targetOff(this);
    }

    scheduleFixedUpdate(callback: Function, interval: number = 1/30): void {
        this.schedule(callback, interval, macro.REPEAT_FOREVER);
        
        game.on(Game.EVENT_HIDE, () => {
            this.unschedule(callback);
        });

        game.on(GlobalEvent.GameResume, () => {
            this.unschedule(callback);
            this.schedule(callback, interval, macro.REPEAT_FOREVER, Math.random());
        });
    }
}