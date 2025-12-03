import { _decorator, Component, director } from 'cc';
import { TopUIItem } from './TopUIItem';
import AddCoinLabel from './AddCoinLabel';
import { GlobalEvent } from './Events';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('NormalMine')
export class NormalMine extends TopUIItem {
    @property(AddCoinLabel)
    countLabel: AddCoinLabel = null!;

    onEnable() {
        super.onEnable?.();
        director.on(GlobalEvent.GameReplay, this._onGameReplay, this);
        director.on(GlobalEvent.GameCollectedAttachItemChange + ITEM.PickAxe, this._playCount, this);
    }

    onDisable() {
        super.onDisable?.();
        director.targetOff(this);
    }

    private _onGameReplay() {
        this._setCount(0);
    }

    playShow(count: number) {
        this.show(0.4);
        this._setCount(count);
    }

    private _setCount(count: number) {
        this.countLabel.string = '' + count;
    }

    private _playCount(count: number) {
        this.countLabel.playTo(count, 0.2);
    }
}