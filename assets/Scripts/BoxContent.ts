import { _decorator, Component, Node, ProgressBar, director, v3 } from 'cc';
import { GlobalEvent } from './Events';
import { MgrMine, EStageBoxState } from './MgrMine';
import { StageBox } from './StageBox';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

const BOX_POSITIONS = [0, 159, 318, 477, 636];
const TRILLER_X_POSITIONS = [-300, -150, 0, 150, 300];

@ccclass('BoxContent')
export class BoxContent extends Component {
    @property(ProgressBar)
    boxProgress: ProgressBar | null = null;

    @property(Node)
    triller: Node | null = null;

    @property([StageBox])
    stageBoxCmps: StageBox[] = [];

    @property(Node)
    boxMaskNode: Node | null = null;

    onLoad() {
        this.stageBoxCmps.forEach((stageBox, index) => {
            stageBox.setStageId(index + 1);
        });
    }

    onEnable() {
        director.on(GlobalEvent.MineOpenBox, this._refreshBoxsState, this);
        this.refreshTriller();
        this._refreshBoxsState();
    }

    onDisable() {
        director.targetOff(this);
    }

    refreshTriller() {
        let maxOpenedId = 0;
        
        each(MgrMine.Instance.data.stageBoxs, (boxData) => {
            if (boxData.state === EStageBoxState.Open) {
                maxOpenedId = Math.max(maxOpenedId, boxData.id);
            }
        });

        if (maxOpenedId >= BOX_POSITIONS.length) {
            this.triller!.active = false;
        } else {
            const progress = (BOX_POSITIONS[maxOpenedId] || 0) / 636;
            this.boxProgress!.progress = progress;
            
            const xPos = TRILLER_X_POSITIONS[maxOpenedId];
            this.triller!.setPosition(v3(xPos, -80, 0));
        }
    }

    _refreshBoxsState() {
        this.stageBoxCmps.forEach(stageBox => {
            stageBox.refreshBox();
        });
    }

    showMask() {
        this.boxMaskNode!.active = true;
    }

    hideMask() {
        this.boxMaskNode!.active = false;
    }
}