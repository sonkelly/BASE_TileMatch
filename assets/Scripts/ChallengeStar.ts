import { _decorator, director } from 'cc';
import AddCoinLabel from './AddCoinLabel';
import { TopUIItem } from './TopUIItem';
import { ITEM } from './GameConst';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('ChallengeStar')
export class ChallengeStar extends TopUIItem {
    @property(AddCoinLabel)
    starCountLabel: AddCoinLabel | null = null;

    onEnable() {
        director.on(GlobalEvent.GameReplay, this.onGameReplay, this);
        director.on(GlobalEvent.GameCollectedAttachItemChange + ITEM.Star, this.onStarChange, this);
    }

    onDisable() {
        super.onDisable();
        director.targetOff(this);
    }

    onGameReplay() {
        this.setCount(0);
    }

    onStarChange(starCount: number) {
        this.playCount(starCount);
    }

    playShow(starCount: number) {
        this.show(0.4);
        this.setCount(starCount);
    }

    setCount(starCount: number) {
        if (this.starCountLabel) {
            this.starCountLabel.string = '' + starCount;
        }
    }

    playCount(starCount: number) {
        if (this.starCountLabel) {
            this.starCountLabel.playTo(starCount, 0.2);
        }
    }
}