import { _decorator, Component, Label, Button, SpriteFrame, Sprite } from 'cc';
import { Language } from './Language';
import { MgrToyRace, RaceRewardIdx } from './MgrToyRace';

const { ccclass, property } = _decorator;

@ccclass('ToyRaceNextTip')
export class ToyRaceNextTip extends Component {
    @property(Label)
    descLabel: Label | null = null;

    @property(Button)
    btnConfirm: Button | null = null;

    @property(Button)
    btnClose: Button | null = null;

    @property(SpriteFrame)
    failFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    successFrame: SpriteFrame | null = null;

    @property(Sprite)
    tittle: Sprite | null = null;

    onLoad() {
        this.btnConfirm?.node.on(Button.EventType.CLICK, this.onClickConfirm, this);
        this.btnClose?.node.on(Button.EventType.CLICK, this.onClickClose, this);
    }

    onClickConfirm() {
        this.node.emit('Close');
    }

    onClickClose() {
        this.node.emit('Close');
    }

    onEnable() {
        if (MgrToyRace.Instance.toyRaceData.players[0].rank <= RaceRewardIdx) {
            this.descLabel!.string = Language.Instance.getLangByID('ToyRaceSuccessNextTip') || 'ToyRaceSuccessNextTip';
            this.setTittleFrame(this.successFrame);
        } else {
            this.descLabel!.string = Language.Instance.getLangByID('ToyRaceFailedNextTip') || 'ToyRaceFailedNextTip';
            this.setTittleFrame(this.failFrame);
        }
    }

    setTittleFrame(frame: SpriteFrame | null) {
        if (this.tittle && frame) {
            this.tittle.spriteFrame = frame;
        }
    }
}