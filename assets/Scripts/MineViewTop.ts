import { _decorator, Component, Node } from 'cc';
import { StageItem } from './StageItem';
const { ccclass, property } = _decorator;

@ccclass('MineViewTop')
export class MineViewTop extends Component {
    @property(StageItem)
    stageItem1: StageItem | null = null;

    @property(StageItem)
    stageItem2: StageItem | null = null;

    private _curStageItem: StageItem | null = null;
    private _nextStageItem: StageItem | null = null;

    onLoad() {
        this._curStageItem = this.stageItem2;
        this._nextStageItem = this.stageItem1;
    }

    onEnable() {}

    onDisable() {}

    switchStage() {
        const temp = this._curStageItem;
        this._curStageItem = this._nextStageItem;
        this._nextStageItem = temp;
        
        this._curStageItem?.node.setSiblingIndex(1);
        this._nextStageItem?.node.setSiblingIndex(0);
    }

    refreshCurStage(data: any) {
        this._curStageItem?.refreshStage(data);
    }

    refreshNextStage(data: any) {
        this._nextStageItem?.refreshStage(data);
    }

    playOpenDoor() {
        this._curStageItem?.playOpenDoor();
    }

    playDoorScaleDark() {
        this._curStageItem?.playDoorScaleDark();
    }

    playDoorUp() {
        this._curStageItem?.playDoorUp();
        this._nextStageItem?.setPeady();
    }

    playStepInto1() {
        this._curStageItem?.playWallScale();
        this._nextStageItem?.playStepInto1();
    }

    playBoxOpen() {
        this._nextStageItem?.playBoxOpen();
    }

    playStepInto2() {
        this._nextStageItem?.playStepInto2();
    }

    get curStageItem(): StageItem | null {
        return this._curStageItem;
    }

    get nextStageItem(): StageItem | null {
        return this._nextStageItem;
    }
}