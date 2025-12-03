import { _decorator, Component, sp, director, v3, cclegacy } from 'cc';
import { MINE_ANIMATION_FRAMEEVENT, MINE_ANIMATION_BREAK, MINE_ANIMATION_HOE } from './MgrMine';
import { GlobalEvent } from './Events';
import { GameAudios } from './Prefabs';
import { AudioPlayer } from './AudioPlayer';

const { ccclass, property } = _decorator;

@ccclass('BrickSpine')
export class BrickSpine extends Component {
    @property(sp.Skeleton)
    digSpine: sp.Skeleton = null!;

    @property(sp.Skeleton)
    breakSpine: sp.Skeleton = null!;

    private _targetBrickItem: any = null;

    onLoad() {
        this.digSpine.setEventListener((event: any, trackEntry: any) => {
            if (trackEntry.data.name === MINE_ANIMATION_FRAMEEVENT) {
                if (this._targetBrickItem) {
                    this._targetBrickItem.refreshBrickShowState();
                }
                this.breakSpine.setAnimation(0, MINE_ANIMATION_BREAK, true);
                AudioPlayer.Instance.playEffect(GameAudios.Mine_break.url);
            }
        });

        this.breakSpine.setCompleteListener(() => {
            this._targetBrickItem = null;
            director.emit(GlobalEvent.MineBreakBrickSpineFinish, this.node);
        });
    }

    reset() {
        this.digSpine.clearTrack(0);
        this.breakSpine.clearTrack(0);
    }

    playDig(targetItem: any, scale: number = 1) {
        this._targetBrickItem = targetItem;
        this.digSpine.clearAnimations();
        this.digSpine.node.setWorldPosition(this._targetBrickItem.node.worldPosition);
        this.digSpine.setAnimation(0, MINE_ANIMATION_HOE, false);
        this.breakSpine.clearAnimations();
        this.breakSpine.node.setWorldPosition(this._targetBrickItem.node.worldPosition);
        this.breakSpine.node.setScale(v3(scale, scale, 1));
    }

    playBreak(targetItem: any, scale: number = 1) {
        this._targetBrickItem = targetItem;
        this.digSpine.clearAnimations();
        this.breakSpine.clearAnimations();
        this.breakSpine.node.setWorldPosition(this._targetBrickItem.node.worldPosition);
        this.breakSpine.node.setScale(v3(scale, scale, 1));
        this.breakSpine.setAnimation(0, MINE_ANIMATION_BREAK, false);
    }
}