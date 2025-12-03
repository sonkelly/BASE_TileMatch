import { _decorator, Component, Button, Label, Node, director, cclegacy } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { MineContent } from './MineContent';
import { MgrMine, GemMapCfg } from './MgrMine';
import { GlobalEvent } from './Events';
import {Utils} from './Utils';
import { ITEM } from './GameConst';
import { MgrUser } from './MgrUser';
import { MineViewTop } from './MineViewTop';
import { AsyncQueue } from './AsyncQueue';
import {MineCfg} from './MineCfg';
import { MineGuide } from './MineGuide';
import { BoxContent } from './BoxContent';

const { ccclass, property } = _decorator;

@ccclass('MineView')
export default class MineView extends Component {
    @property(Button)
    public backBtn: Button | null = null;

    @property(Button)
    public helpBtn: Button | null = null;

    @property(Label)
    public timeLabel: Label | null = null;

    @property(Label)
    public pickaxeLabel: Label | null = null;

    @property(Node)
    public pickaxeNode: Node | null = null;

    @property(BoxContent)
    public boxContent: BoxContent | null = null;

    @property(MineContent)
    public mineContent: MineContent | null = null;

    @property(MineViewTop)
    public mineViewTop: MineViewTop | null = null;

    @property(MineGuide)
    public mineGuide: MineGuide | null = null;

    private _curMineCfg: any | null = null;
    private _nextMineCfg: any | null = null;
    private _taskAsync: AsyncQueue | null = null;

    public getCurMineCfg() {
        return this._curMineCfg;
    }

    public getNextMineCfg() {
        return this._nextMineCfg;
    }

    onLoad() {
        this.backBtn?.node.on('click', this._onClickBack, this);
        this.helpBtn?.node.on('click', this._onClickHelp, this);
        if (this.mineContent) this.mineContent.delegate = this;
        if (this.mineGuide) this.mineGuide.delegate = this;
    }

    onEnable() {
        director.on(GlobalEvent.MineRefreshRemainTime, this._onMineRefreshRemainTime, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.PickAxe, this._onPickAxeChange, this);
        director.on(GlobalEvent.MinePlayGame, this._onMinePlayGame, this);

        this._onMineRefreshRemainTime();
        this._onPickAxeChange();
        this._refreshStageInfo();

        if (this.mineContent?.curMineItem?.node) this.mineContent.curMineItem.node.active = false;
        if (this.mineContent?.nextMineItem?.node) this.mineContent.nextMineItem.node.active = false;

        this.mineContent?.refreshCurMine(this._curMineCfg);
        this.mineViewTop?.refreshCurStage(this._curMineCfg);
        this.mineGuide?.checkGuideStep();
    }

    onDisable() {
        director.targetOff(this);
        if (this._taskAsync != null) {
            this._taskAsync.clear();
        }
        this._taskAsync = null;
        this.unscheduleAllCallbacks();
    }

    private _refreshStageInfo() {
        if (MgrMine.Instance.isFinish()) {
            this._curMineCfg = null;
            this._nextMineCfg = null;
            return;
        }

        if (MgrMine.Instance.data.stage == MineCfg.Instance.maxStage) {
            this._curMineCfg = MineCfg.Instance.get(MgrMine.Instance.data.stage);
            this._nextMineCfg = null;
        } else {
            this._curMineCfg = MineCfg.Instance.get(MgrMine.Instance.data.stage);
            this._nextMineCfg = MineCfg.Instance.get(MgrMine.Instance.data.stage + 1);
        }
    }

    public getCurStageGems() {
        return this.mineViewTop?.curStageItem?.stageGemCmps;
    }

    public showAdvanced() {
        const self = this;
        this._taskAsync = new AsyncQueue();

        this._taskAsync.push((done: Function) => {
            if (self.backBtn) self.backBtn.node.active = false;
            done();
        });

        this._taskAsync.push((done: Function) => {
            self.mineContent?.refreshNextMine(self._nextMineCfg);
            self.mineViewTop?.refreshNextStage(self._nextMineCfg);
            done();
        });

        this._taskAsync.push((done: Function) => {
            self.mineContent?.showMask();
            self.scheduleOnce(() => done(), 0.48);
        });

        this._taskAsync.push((done: Function) => {
            self.mineViewTop?.playOpenDoor();
            self.scheduleOnce(() => done(), 0.32);
        });

        this._taskAsync.push((done: Function) => {
            self.mineViewTop?.playDoorScaleDark();
            self.scheduleOnce(() => done(), 0.32);
        });

        this._taskAsync.push((done: Function) => {
            self.mineViewTop?.playDoorUp();
            self.scheduleOnce(() => done(), 2);
        });

        this._taskAsync.push((done: Function) => {
            self.mineViewTop?.playStepInto1();
            self.scheduleOnce(() => done(), 2);
        });

        this._taskAsync.push((done: Function) => {
            self.mineViewTop?.playBoxOpen();
            self.scheduleOnce(() => done(), 0.5);
        });

        this._taskAsync.push((done: Function) => {
            const reward = MineCfg.Instance.get(self._curMineCfg.id).rewardInfo;
            MgrUi.Instance.openViewAsync(UIPrefabs.MineRewardView, {
                data: {
                    reward,
                    hideCall: () => {
                        done();
                    }
                },
                callback: () => {
                    director.emit(GlobalEvent.MineOpenBox);
                }
            });
        });

        this._taskAsync.push((done: Function) => {
            self.boxContent?.refreshTriller();
            done();
        });

        this._taskAsync.push((done: Function) => {
            self.mineViewTop?.playStepInto2();
            self.mineContent?.showSwitchMine();
            self.scheduleOnce(() => done(), 1);
        });

        this._taskAsync.push((done: Function) => {
            self.mineContent?.hideMask();
            done();
        });

        this._taskAsync.push((done: Function) => {
            self._refreshStageInfo();
            self.mineViewTop?.switchStage();
            self.mineContent?.switchStage();
            done();
        });

        this._taskAsync.complete = () => {
            if (self.backBtn) self.backBtn.node.active = true;
        };

        this._taskAsync.play();
    }

    private _onMineRefreshRemainTime() {
        const remain = MgrMine.Instance.remainTime;
        if (this.timeLabel) this.timeLabel.string = remain >= 0 ? Utils.timeConvertToHHMM(remain) : '';
    }

    public getMapTargetBrick(gemId: number, posIndex: number) {
        const gemMapId = MgrMine.Instance.data.gemMapId;
        const gems = GemMapCfg[gemMapId].gems;
        let targetGem: any | null = null;
        for (let i = 0; i < gems.length; i++) {
            if (gems[i].id == gemId) {
                targetGem = gems[i];
                break;
            }
        }
        if (!targetGem) {
            console.error('no gem!');
            return null;
        }

        const brickItems = this.mineContent?.curMineItem?.brickItems || [];
        if (brickItems.length <= 0) {
            console.log('no brickItems!');
            return null;
        }

        const targetPosId = targetGem.pos[posIndex];
        let targetBrick = null;
        for (let i = 0; i < brickItems.length; i++) {
            if (brickItems[i].brickInfo.id == targetPosId) {
                targetBrick = brickItems[i];
                break;
            }
        }

        if (!targetBrick) {
            console.error('no targetBrick!');
            return null;
        }

        return targetBrick;
    }

    public getMapGemWorldPosition(gemId: number) {
        const gemMapId = MgrMine.Instance.data.gemMapId;
        const gems = GemMapCfg[gemMapId].gems;
        let targetGem: any | null = null;
        for (let i = 0; i < gems.length; i++) {
            if (gems[i].id == gemId) {
                targetGem = gems[i];
                break;
            }
        }
        if (!targetGem) {
            console.error('no gem!');
            return null;
        }

        const brickItems = this.mineContent?.curMineItem?.brickItems || [];
        if (brickItems.length <= 0) {
            console.log('no brickItems!');
            return null;
        }

        const worldPositions: any[] = [];
        for (let i = 0; i < targetGem.pos.length; i++) {
            const idx = targetGem.pos[i] - 1;
            const brick = brickItems[idx];
            worldPositions.push(brick.node.worldPosition);
        }

        return MgrMine.Instance.getGemPosById(targetGem.gemId, worldPositions);
    }

    public getMapGemCotentSize(gemId: number) {
        const gemMapId = MgrMine.Instance.data.gemMapId;
        const gems = GemMapCfg[gemMapId].gems;
        let targetGem: any | null = null;
        for (let i = 0; i < gems.length; i++) {
            if (gems[i].id == gemId) {
                targetGem = gems[i];
                break;
            }
        }
        if (!targetGem) {
            console.error('no gem!');
            return null;
        }
        return MgrMine.Instance.getGemContentSizeById(targetGem.gemId);
    }

    public checkGuideLimtedTouch(evt: any) {
        return this.mineGuide?.checkGuideLimtedTouch(evt);
    }

    public getGemNode() {
        return this.mineViewTop?.curStageItem?.gemNode;
    }

    public getWallDoorNode() {
        return this.mineViewTop?.curStageItem?.wallDoorNode;
    }

    public getPickaxeNode() {
        return this.pickaxeNode;
    }

    public getBoxContentCmp() {
        return this.boxContent;
    }

    private _onPickAxeChange() {
        if (this.pickaxeLabel) {
            this.pickaxeLabel.string = '' + MgrUser.Instance.userData.getItem(ITEM.PickAxe);
        }
    }

    private _onClickHelp() {
        MgrUi.Instance.openViewAsync(UIPrefabs.MineHelpView);
    }

    private _onClickBack() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }

    private _onMinePlayGame() {
        this._onClickBack();
    }
}