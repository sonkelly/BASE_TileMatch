import { _decorator, director, v3, Size, macro } from 'cc';
const { ccclass } = _decorator;

import {MgrBase} from './MgrBase';
import {MineData} from './MineData';
import {MgrGame} from './MgrGame';
import { GameConst, ITEM } from './GameConst';
import {Tools} from './Tools';
import { GlobalEvent } from './Events';
import {MgrUser} from './MgrUser';
import { AppGame } from './AppGame';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {MgrWeakGuide} from './MgrWeakGuide';
import { GuidePos } from './WeakGuide';
import {each} from 'lodash-es';
import {MineGemCfg} from './MineGemCfg';
import {MineCfg} from './MineCfg';
import { BrickItemSize } from './MineItem';
import {AnalyticsManager} from './AnalyticsManager';
import {Utils} from './Utils';
import {Language} from './Language';
import { ACTIVE_STATUS } from './Const';

/** Constants */
export const MINE_STAGE_START_ID = 1;
export const MINE_ANIMATION_HOE = 'hoe';
export const MINE_ANIMATION_BREAK = 'broken';
export const MINE_ANIMATION_FRAMEEVENT = 'broken';
export const MINE_ANIMATION_OPEN_DOOR = 'open_door';

export const GemStageCfg: Record<number, any> = {
    1: {
        stage: 1,
        gems: [
            { id: 1, gemId: 1, idx: 7 },
            { id: 2, gemId: 1, idx: 3 },
            { id: 3, gemId: 2, idx: 1 },
            { id: 4, gemId: 3, idx: 9 }
        ]
    },
    2: {
        stage: 2,
        gems: [
            { id: 1, gemId: 4, idx: 7 },
            { id: 2, gemId: 4, idx: 3 },
            { id: 3, gemId: 5, idx: 1 },
            { id: 4, gemId: 5, idx: 5 },
            { id: 5, gemId: 6, idx: 9 }
        ]
    },
    3: {
        stage: 3,
        gems: [
            { id: 1, gemId: 7, idx: 7 },
            { id: 2, gemId: 7, idx: 3 },
            { id: 3, gemId: 8, idx: 1 },
            { id: 4, gemId: 9, idx: 9 },
            { id: 5, gemId: 10, idx: 4 },
            { id: 6, gemId: 10, idx: 6 }
        ]
    },
    4: {
        stage: 4,
        gems: [
            { id: 1, gemId: 11, idx: 7 },
            { id: 2, gemId: 11, idx: 3 },
            { id: 3, gemId: 12, idx: 1 },
            { id: 4, gemId: 13, idx: 5 },
            { id: 5, gemId: 14, idx: 4 },
            { id: 6, gemId: 14, idx: 6 },
            { id: 7, gemId: 15, idx: 9 }
        ]
    },
    5: {
        stage: 5,
        gems: [
            { id: 1, gemId: 16, idx: 9 },
            { id: 2, gemId: 17, idx: 1 },
            { id: 3, gemId: 18, idx: 4 },
            { id: 4, gemId: 18, idx: 6 },
            { id: 5, gemId: 19, idx: 7 },
            { id: 6, gemId: 19, idx: 3 },
            { id: 7, gemId: 20, idx: 8 },
            { id: 8, gemId: 20, idx: 2 }
        ]
    }
};

export const GemMapCfg: Record<number, any> = {
    0xA: {
        id: 0xA, stage: 1, gems: [
            { id: 1, gemId: 1, pos: [0x8, 0xC] },
            { id: 2, gemId: 1, pos: [0x5, 0x9] },
            { id: 3, gemId: 2, pos: [1, 2, 3] },
            { id: 4, gemId: 3, pos: [0xA, 0xB, 0xE, 0xF] }
        ]
    },
    0xB: {
        id: 0xB, stage: 1, gems: [
            { id: 1, gemId: 1, pos: [4, 8] },
            { id: 2, gemId: 1, pos: [9, 0xD] },
            { id: 3, gemId: 2, pos: [0xE, 0xF, 0x10] },
            { id: 4, gemId: 3, pos: [2, 3, 6, 7] }
        ]
    },
    0xC: {
        id: 0xC, stage: 1, gems: [
            { id: 1, gemId: 1, pos: [8, 0xC] },
            { id: 2, gemId: 1, pos: [7, 0xB] },
            { id: 3, gemId: 2, pos: [1, 2, 3] },
            { id: 4, gemId: 3, pos: [9, 0xA, 0xD, 0xE] }
        ]
    },
    0x14: {
        id: 0x14, stage: 2, gems: [
            { id: 1, gemId: 4, pos: [3, 8, 0xD] },
            { id: 2, gemId: 4, pos: [0xF, 0x14, 0x19] },
            { id: 3, gemId: 5, pos: [0x15, 0x16] },
            { id: 4, gemId: 5, pos: [9, 0xA] },
            { id: 5, gemId: 6, pos: [1, 2, 6, 7, 0xB, 0xC] }
        ]
    },
    0x15: {
        id: 0x15, stage: 2, gems: [
            { id: 1, gemId: 4, pos: [0xE, 0x13, 0x18] },
            { id: 2, gemId: 4, pos: [0xF, 0x14, 0x19] },
            { id: 3, gemId: 5, pos: [0x10, 0x11] },
            { id: 4, gemId: 5, pos: [3, 4] },
            { id: 5, gemId: 6, pos: [1, 2, 6, 7, 0xB, 0xC] }
        ]
    },
    0x16: {
        id: 0x16, stage: 2, gems: [
            { id: 1, gemId: 4, pos: [1, 6, 0xB] },
            { id: 2, gemId: 4, pos: [0xA, 0xF, 0x14] },
            { id: 3, gemId: 5, pos: [8, 9] },
            { id: 4, gemId: 5, pos: [0x18, 0x19] },
            { id: 5, gemId: 6, pos: [0xC, 0xD, 0x11, 0x12, 0x16, 0x17] }
        ]
    },
    0x1E: {
        id: 0x1E, stage: 3, gems: [
            { id: 1, gemId: 7, pos: [0xD, 0xE, 0x13, 0x14, 0x19, 0x1A] },
            { id: 2, gemId: 7, pos: [5, 6, 0xB, 0xC, 0x11, 0x12] },
            { id: 3, gemId: 8, pos: [3, 4] },
            { id: 4, gemId: 9, pos: [0x16, 0x17, 0x1C, 0x1D] },
            { id: 5, gemId: 10, pos: [8, 9, 0xA] },
            { id: 6, gemId: 10, pos: [0x20, 0x21, 0x22] }
        ]
    },
    0x1F: {
        id: 0x1F, stage: 3, gems: [
            { id: 1, gemId: 7, pos: [0x13, 0x14, 0x19, 0x1A, 0x1F, 0x20] },
            { id: 2, gemId: 7, pos: [0x11, 0x12, 0x17, 0x18, 0x1D, 0x1E] },
            { id: 3, gemId: 8, pos: [7, 8] },
            { id: 4, gemId: 9, pos: [3, 4, 9, 0xA] },
            { id: 5, gemId: 10, pos: [0xE, 0xF, 0x10] },
            { id: 6, gemId: 10, pos: [0x22, 0x23, 0x24] }
        ]
    },
    0x20: {
        id: 0x20, stage: 3, gems: [
            { id: 1, gemId: 7, pos: [1, 2, 7, 8, 0xD, 0xE] },
            { id: 2, gemId: 7, pos: [0x13, 0x14, 0x19, 0x1A, 0x1F, 0x20] },
            { id: 3, gemId: 8, pos: [0x1D, 0x1E] },
            { id: 4, gemId: 9, pos: [0x15, 0x16, 0x1B, 0x1C] },
            { id: 5, gemId: 10, pos: [9, 0xA, 0xB] },
            { id: 6, gemId: 10, pos: [0xF, 0x10, 0x11] }
        ]
    },
    0x28: {
        id: 0x28, stage: 4, gems: [
            { id: 1, gemId: 11, pos: [0x19, 0x20, 0x27, 0x2E] },
            { id: 2, gemId: 11, pos: [2, 9, 0x10, 0x17] },
            { id: 3, gemId: 12, pos: [0xC, 0xD, 0xE, 0x13, 0x14, 0x15] },
            { id: 4, gemId: 13, pos: [0x24, 0x2B] },
            { id: 5, gemId: 14, pos: [0xA, 0xB, 0x11, 0x12] },
            { id: 6, gemId: 14, pos: [0x1E, 0x1F, 0x25, 0x26] },
            { id: 7, gemId: 15, pos: [0x21, 0x22, 0x23, 0x28, 0x29, 0x2A, 0x2F, 0x30, 0x31] }
        ]
    },
    0x29: {
        id: 0x29, stage: 4, gems: [
            { id: 1, gemId: 11, pos: [1, 8, 0xF, 0x16] },
            { id: 2, gemId: 11, pos: [0x1C, 0x23, 0x2A, 0x31] },
            { id: 3, gemId: 12, pos: [0x24, 0x25, 0x26, 0x2B, 0x2C, 0x2D] },
            { id: 4, gemId: 13, pos: [4, 0xB] },
            { id: 5, gemId: 14, pos: [0xD, 0xE, 0x14, 0x15] },
            { id: 6, gemId: 14, pos: [0x17, 0x18, 0x1E, 0x1F] },
            { id: 7, gemId: 15, pos: [0x19, 0x1A, 0x1B, 0x20, 0x21, 0x22, 0x27, 0x28, 0x29] }
        ]
    },
    0x2A: {
        id: 0x2A, stage: 4, gems: [
            { id: 1, gemId: 11, pos: [0xF, 0x16, 0x1D, 0x24] },
            { id: 2, gemId: 11, pos: [2, 9, 0x10, 0x17] },
            { id: 3, gemId: 12, pos: [0x13, 0x14, 0x15, 0x1A, 0x1B, 0x1C] },
            { id: 4, gemId: 13, pos: [0x22, 0x29] },
            { id: 5, gemId: 14, pos: [0x11, 0x12, 0x18, 0x19] },
            { id: 6, gemId: 14, pos: [6, 7, 0xD, 0xE] },
            { id: 7, gemId: 15, pos: [0x1E, 0x1F, 0x20, 0x25, 0x26, 0x27, 0x2C, 0x2D, 0x2E] }
        ]
    },
    0x32: {
        id: 0x32, stage: 5, gems: [
            { id: 1, gemId: 16, pos: [0x21, 0x22, 0x23, 0x24, 0x29, 0x2A, 0x2B, 0x2C, 0x31, 0x32, 0x33, 0x34, 0x39, 0x3A, 0x3B, 0x3C] },
            { id: 2, gemId: 17, pos: [1, 2, 9, 0xA, 0x11, 0x12, 0x19, 0x1A] },
            { id: 3, gemId: 18, pos: [0x20, 0x28, 0x30, 0x38, 0x40] },
            { id: 4, gemId: 18, pos: [7, 0xF, 0x17, 0x1F, 0x27] },
            { id: 5, gemId: 19, pos: [0xB, 0xC, 0xD] },
            { id: 6, gemId: 19, pos: [0x35, 0x36, 0x37] },
            { id: 7, gemId: 20, pos: [0x1C, 0x1D] },
            { id: 8, gemId: 20, pos: [5, 6] }
        ]
    },
    0x33: {
        id: 0x33, stage: 5, gems: [
            { id: 1, gemId: 16, pos: [0x1A, 0x1B, 0x1C, 0x1D, 0x22, 0x23, 0x24, 0x25, 0x2A, 0x2B, 0x2C, 0x2D, 0x32, 0x33, 0x34, 0x35] },
            { id: 2, gemId: 17, pos: [0x16, 0x17, 0x1E, 0x1F, 0x26, 0x27, 0x2E, 0x2F] },
            { id: 3, gemId: 18, pos: [9, 0x11, 0x19, 0x21, 0x29] },
            { id: 4, gemId: 18, pos: [0x18, 0x20, 0x28, 0x30, 0x38] },
            { id: 5, gemId: 19, pos: [0xD, 0xE, 0xF] },
            { id: 6, gemId: 19, pos: [0x39, 0x3A, 0x3B] },
            { id: 7, gemId: 20, pos: [2, 3] },
            { id: 8, gemId: 20, pos: [0x3D, 0x3E] }
        ]
    },
    0x34: {
        id: 0x34, stage: 5, gems: [
            { id: 1, gemId: 16, pos: [0x13, 0x14, 0x15, 0x16, 0x1B, 0x1C, 0x1D, 0x1E, 0x23, 0x24, 0x25, 0x26, 0x2B, 0x2C, 0x2D, 0x2E] },
            { id: 2, gemId: 17, pos: [0x21, 0x22, 0x29, 0x2A, 0x31, 0x32, 0x39, 0x3A] },
            { id: 3, gemId: 18, pos: [7, 0xF, 0x17, 0x1F, 0x27] },
            { id: 4, gemId: 18, pos: [0x10, 0x18, 0x20, 0x28, 0x30] },
            { id: 5, gemId: 19, pos: [2, 3, 4] },
            { id: 6, gemId: 19, pos: [0x36, 0x37, 0x38] },
            { id: 7, gemId: 20, pos: [0x33, 0x34] },
            { id: 8, gemId: 20, pos: [0xC, 0xD] }
        ]
    }
};

export const MineGuideSteps = [
    { id: 1, tipY: 0x50 },
    { id: 2, tipY: 0x50 },
    { id: 3, tipY: -0x154 },
    { id: 4, tipY: -0x24 }
];

/** Enums */
export enum EBrickState { Idle = 0, Break = 1 }
export enum EGemState { Idle = 0, Collect = 1 }
export enum EStageBoxState { Idle = 0, Open = 1 }
export enum MineActivityStatus { Wait = 0, Open = 1, Complete = 2 }

@ccclass('MgrMine')
export class MgrMine extends MgrBase {
    private _data: MineData | null = null;
    private _status: MineActivityStatus = MineActivityStatus.Wait;
    private _remainTime: number = 0;
    private _gemMapCfgs: Map<number, number[]> = new Map();

    private static _instance: MgrMine | null = null;

    constructor(...args: any[]) {
        super(...args);
        MgrMine._instance = this;
    }

    onLoad() {
        this._data = new MineData('Mine');
        this._dealGemMap();
    }

    load() {
        this._data?.load();
        this._checkMineActivity();
    }

    initLoadData() {
        // schedule fixed update every 1 second, offset random(0,1)
        this.schedule(this._fixedUpdate, 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _fixedUpdate(dt: number) {
        this._checkMineActivity();
    }

    private _dealGemMap() {
        // map stage -> list of map ids
        each(GemMapCfg, (cfg: any) => {
            const stage = cfg.stage;
            let arr = this._gemMapCfgs.get(stage);
            if (!arr) {
                arr = [];
            }
            arr.push(cfg.id);
            this._gemMapCfgs.set(stage, arr);
        });
    }

    private _checkMineActivity() {
        if (MgrGame.Instance.gameData.maxLv < GameConst.MINE_OPEN_LEVEL) {
            if (this._status !== MineActivityStatus.Wait) {
                this._status = MineActivityStatus.Wait;
                director.emit(GlobalEvent.MineStateChange);
            }
            return;
        }

        this._data?.refreshMineInfo();

        if (!this._data?.recentPeriod) {
            if (this._status !== MineActivityStatus.Wait) {
                this._status = MineActivityStatus.Wait;
                director.emit(GlobalEvent.MineStateChange);
            }
            return;
        }

        const now = Tools.GetNowTime();

        if (now < (this._data?.recentStartTime ?? 0)) {
            if (this._status !== MineActivityStatus.Wait) {
                this._status = MineActivityStatus.Wait;
                director.emit(GlobalEvent.MineStateChange);
            }
            return;
        }

        if (now >= (this._data?.recentEndTime ?? 0)) {
            if (this._status !== MineActivityStatus.Wait) {
                this._status = MineActivityStatus.Wait;
                director.emit(GlobalEvent.MineStateChange);
            }
            return;
        }

        // within active period
        this.remainTime = (this._data!.recentEndTime - now);
        if (this._data!.inPeriod === this._data!.recentPeriod) {
            if (this._checkStageAllComplete()) {
                if (this._status !== MineActivityStatus.Complete) {
                    this._status = MineActivityStatus.Complete;
                    director.emit(GlobalEvent.MineStateChange);
                }
            } else {
                if (this._status !== MineActivityStatus.Open) {
                    this._status = MineActivityStatus.Open;
                    director.emit(GlobalEvent.MineStateChange);
                }
            }
        } else {
            // new period entering
            this._data!.inPeriod = this._data!.recentPeriod;
            MgrUser.Instance.userData.setItem(ITEM.PickAxe, GameConst.MINE_START_PICKAXE);
            this._data!.tip = true;
            this._data!.setStageBox();
            this._setIntoStage(MINE_STAGE_START_ID);
            if (this._status !== MineActivityStatus.Open) {
                this._status = MineActivityStatus.Open;
                director.emit(GlobalEvent.MineStateChange);
            }
            const isFirst = this._data!.guideStep === 1 ? 1 : 0;
            AnalyticsManager.getInstance().reportMiningOpen({ Mining_Is_First: isFirst });
        }
    }

    private _setIntoStage(stageId: number) {
        if (!this._data) return;
        this._data.stage = stageId;
        this._data.gemMapId = this._getRadomMapId();
        this._data.setBrickMap();
        this._data.setGemMap(GemMapCfg[this._data.gemMapId]);
    }

    private _getRadomMapId(): number {
        const arr = this._gemMapCfgs.get(this._data!.stage);
        if (arr && arr.length > 0) {
            return arr[Math.floor(Math.random() * arr.length)];
        } else {
            console.error('no stage maps!');
            return 0;
        }
    }

    private _checkStageAllComplete(): boolean {
        if (!this._data) return false;
        let ok = true;
        each(this._data.stageBoxs, (box: any) => {
            if (box.state !== EStageBoxState.Open) ok = false;
        });
        return ok;
    }

    isOpen(): boolean {
        return this._status !== MineActivityStatus.Wait;
    }

    isFinish(): boolean {
        return this._status === MineActivityStatus.Complete;
    }

    checkInGuide(): boolean {
        if (!this._data) return false;
        return this._data.stage === 1 && !(this._data.guideStep > MineGuideSteps.length);
    }

    showRedDot(): boolean {
        return (MgrUser.Instance.userData.getItem(ITEM.PickAxe) > 0) && !this.isFinish();
    }

    hitBrick(idx: number): boolean {
        if (!this._data) {
            console.error('no data');
            return false;
        }
        const info = this._data.getMapBrickInfo(idx);
        if (!info) {
            console.error('no brickInfo!');
            return false;
        }
        if (info.state === EBrickState.Break) {
            console.error('brick is Breaked!');
            return false;
        }
        info.state = EBrickState.Break;
        this._data.doDrity();
        return true;
    }

    digGem(posIdx: number) {
        if (!this._data) return null;
        const mapId = this._data.gemMapId;
        const cfg = GemMapCfg[mapId];
        if (!cfg) return null;
        let found: any = null;
        const gems = cfg.gems;
        for (let i = 0; i < gems.length; i++) {
            const g = gems[i];
            if (g.pos.includes(posIdx)) {
                found = g;
                break;
            }
        }
        if (!found) return null;
        // check all bricks of this gem are broken
        let allBroken = true;
        for (let i = 0; i < found.pos.length; i++) {
            const p = found.pos[i];
            const brick = this._data.getMapBrickInfo(p);
            if (!brick || brick.state !== EBrickState.Break) {
                allBroken = false;
                break;
            }
        }
        if (allBroken) {
            this._collectGem(found.id);
            return found;
        }
        return null;
    }

    private _collectGem(gemId: number) {
        if (!this._data) return;
        const gemInfo = this._data.getMapGemInfo(gemId);
        if (!gemInfo) return;
        gemInfo.state = EGemState.Collect;
        this._data.doDrity();

        let allCollected = true;
        each(this._data.gemMap, (g: any) => {
            if (g.state !== EGemState.Collect) allCollected = false;
        });

        if (allCollected) {
            const stageCfg = MineCfg.Instance.get(this._data.stage);
            const rewardInfo = stageCfg.rewardInfo || [];
            for (let i = 0; i < rewardInfo.length; i++) {
                const r = rewardInfo[i];
                MgrUser.Instance.userData.addItem(r.id, r.count, { type: 'Mining' });
            }

            // report
            let rewardStr = '';
            stageCfg.reward.forEach((r: any, idx: number) => {
                rewardStr += r;
                if (idx !== stageCfg.reward.length - 1) rewardStr += ',';
            });

            AnalyticsManager.getInstance().reportMiningGet({
                Mining_Stage: this._data.stage,
                Reward: rewardStr
            });

            this._data.getStageBoxInfo(this._data.stage).state = EStageBoxState.Open;
            this._data.doDrity();

            if (this._checkStageAllComplete()) {
                if (this._status !== MineActivityStatus.Complete) {
                    this._status = MineActivityStatus.Complete;
                    director.emit(GlobalEvent.MineStateChange);
                }
            } else {
                const nextStage = this._data.stage + 1;
                if (nextStage <= MineCfg.Instance.maxStage) {
                    this._setIntoStage(nextStage);
                }
            }
        }
    }

    checkNeedGuide(): boolean {
        return this.isOpen() && !this._data!.tip;
    }

    guide(callback?: Function) {
        if (!this._data) return;
        this._data.tip = true;
        const mineBtn = AppGame.topUI.mineBtn;
        const mineView = UIPrefabs.MineView;
        let clicked = false;

        MgrWeakGuide.Instance.openWeakGuide({
            node: mineBtn.node,
            click: () => {
                if (mineView) {
                    clicked = true;
                    const v = MgrUi.Instance.getView(mineView.url);
                    if (v) {
                        v.once(VIEW_ANIM_EVENT.Remove, callback);
                    } else if (MgrUi.Instance.hasViewQueus(mineView.url)) {
                        MgrUi.Instance.addViewAsyncQueueCallback(mineView, (view: any) => {
                            view.once(VIEW_ANIM_EVENT.Remove, callback);
                        });
                    } else {
                        MgrUi.Instance.addViewAsyncQueue(mineView, {
                            root: MgrUi.root(2),
                            callback: (view: any) => {
                                view.once(VIEW_ANIM_EVENT.Remove, callback);
                            }
                        });
                    }
                }
            },
            close: () => {
                this._data!.tip = true;
                if (!clicked) {
                    if (callback) callback();
                }
            },
            pos: GuidePos.Right,
            lang: 'mine_join_tip'
        });
    }

    getGemPosById(gemId: number, wPosList: { x: number, y: number }[]) {
        const cfg = MineGemCfg.Instance.get(gemId);
        if (!cfg) {
            console.error('no gem cfg for id', gemId);
            return v3(0, 0, 0);
        }
        if (wPosList.length !== cfg.mineCout) {
            console.error('wPosList length error!');
            return v3(0, 0, 0);
        }

        let rx = 0, ry = 0;
        switch (cfg.posType) {
            case '2x1':
                rx = wPosList[0].x;
                ry = (wPosList[0].y + wPosList[1].y) / 2;
                break;
            case '1x3':
                rx = wPosList[1].x;
                ry = wPosList[1].y;
                break;
            case '2x2':
                rx = (wPosList[0].x + wPosList[1].x) / 2;
                ry = (wPosList[0].y + wPosList[2].y) / 2;
                break;
            case '3x1':
                rx = wPosList[1].x;
                ry = wPosList[1].y;
                break;
            case '1x2':
                rx = (wPosList[0].x + wPosList[1].x) / 2;
                ry = wPosList[0].y;
                break;
            case '3x2':
                rx = (wPosList[2].x + wPosList[3].x) / 2;
                ry = wPosList[2].y;
                break;
            case '4x1':
                rx = wPosList[1].x;
                ry = (wPosList[1].y + wPosList[2].y) / 2;
                break;
            case '2x3':
                rx = wPosList[1].x;
                ry = (wPosList[1].y + wPosList[4].y) / 2;
                break;
            case '3x3':
                rx = wPosList[4].x;
                ry = wPosList[4].y;
                break;
            case '4x4':
                rx = (wPosList[5].x + wPosList[6].x) / 2;
                ry = (wPosList[5].y + wPosList[9].y) / 2;
                break;
            case '4x2':
                rx = (wPosList[2].x + wPosList[3].x) / 2;
                ry = (wPosList[2].y + wPosList[4].y) / 2;
                break;
            case '5x1':
                rx = wPosList[2].x;
                ry = wPosList[2].y;
                break;
            default:
                console.error('posType error!');
        }
        return v3(rx, ry, 0);
    }

    getGemContentSizeById(gemId: number): Size {
        const cfg = MineGemCfg.Instance.get(gemId);
        const size = new Size();
        const item = BrickItemSize - 8;
        let w = 0, h = 0;
        switch (cfg.posType) {
            case '2x1':
                w = item; h = 2 * item;
                break;
            case '1x3':
                w = 3 * item; h = item;
                break;
            case '2x2':
                w = 2 * item; h = 2 * item;
                break;
            case '3x1':
                w = item; h = 3 * item;
                break;
            case '1x2':
                w = 2 * item; h = item;
                break;
            case '3x2':
                w = 2 * item; h = 3 * item;
                break;
            case '4x1':
                w = item; h = 4 * item;
                break;
            case '2x3':
                w = 3 * item; h = 2 * item;
                break;
            case '3x3':
                w = 3 * item; h = 3 * item;
                break;
            case '4x4':
                w = 4 * item; h = 4 * item;
                break;
            case '4x2':
                w = 2 * item; h = 4 * item;
                break;
            case '5x1':
                w = item; h = 5 * item;
                break;
            default:
                console.error('posType error!');
        }
        size.width = w; size.height = h;
        return size;
    }

    getNormalSuffixByStage(stageId: number): string {
        switch (stageId) {
            case 1: return '1';
            case 2:
            case 3: return '2';
            case 4:
            case 5: return '3';
            default:
                console.error('stageId Err! stageId:', stageId);
                return '1';
        }
    }

    getTowerSuffixByStage(stageId: number): string {
        switch (stageId) {
            case 1: return '1';
            case 2: return '2';
            case 3: return '3';
            case 4: return '4';
            case 5: return '5';
            default:
                console.error('stageId Err! stageId:', stageId);
                return '1';
        }
    }

    getStageGemBgSuffixByStage(stageId: number): string {
        switch (stageId) {
            case 1:
            case 2:
            case 3: return '1';
            case 4:
            case 5: return '2';
            default:
                console.error('stageId Err! stageId:', stageId);
                return '1';
        }
    }

    getPartStageSpNameByIdx(idx: number): string {
        let name = '';
        switch (idx) {
            case 1: name = 't_top_wall'; break;
            case 2: name = 'b_top_wall'; break;
            case 3: name = 't_right_wall'; break;
            case 4: name = 'b_right_wall'; break;
            case 5: name = 't_behind_wall'; break;
            case 6: name = 'b_behind_wall'; break;
            case 7: name = 't_left_wall'; break;
            case 8: name = 'b_left_wall'; break;
            default: name = ''; break;
        }
        return name;
    }

    getStageGemPositon(idx: number) {
        switch (idx) {
            case 1: return v3(0, 0x64, 0);
            case 2: return v3(0x50, 0x50, 0);
            case 3: return v3(0x64, 0, 0);
            case 4: return v3(0x50, -0x50, 0);
            case 5: return v3(0, -0x64, 0);
            case 6: return v3(-0x50, -0x50, 0);
            case 7: return v3(-0x64, 0, 0);
            case 8: return v3(-0x50, 0x50, 0);
            case 9: return v3(0, 0, 0);
            default:
                console.error('idx Err!');
                return v3(0, 0, 0);
        }
    }

    getFinishWallResName() { return 'wall3'; }
    getFinishWallDoorResName() { return 'wall_over'; }

    getBoxAnimaNameLoop(id: number) { return `giftbox${id}_loop`; }
    getBoxAnimaNameOpen(id: number) { return `giftbox${id}_open`; }
    getBoxAnimaNameOpenIdel(id: number) { return `giftbox${id}_open_idle`; }

    getAttachPickAxeCnt(): number {
        const parts = GameConst.NORMAL_PICKAXE_NUM.split(',');
        const values: number[] = [];
        const weights: number[] = [];
        let total = 0;
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i].split('|');
            const val = Number(p[0]);
            const wt = Number(p[1]);
            values.push(val);
            weights.push(wt);
            total += wt;
        }
        let rnd = Utils.randomRange(1, total);
        for (let i = 0; i < weights.length; i++) {
            if (rnd <= weights[i]) return values[i];
            rnd -= weights[i];
        }
        return 1;
    }

    setStageAndMap(stage: number, mapId: number) {
        if (!this._data) return;
        this._data.stage = stage;
        this._data.gemMapId = mapId;
        this._data.setBrickMap();
        this._data.setGemMap(GemMapCfg[this._data.gemMapId]);
    }

    reportProgress() {
        if (!this._data) return;
        let collected = 0;
        each(this._data.gemMap, (g: any) => { if (g.state === EGemState.Collect) collected++; });
        const stage = this._data.stage;
        const pick = MgrUser.Instance.userData.getItem(ITEM.PickAxe) || 0;
        AnalyticsManager.getInstance().reportMiningProgress({
            Mining_Stage: stage,
            Pickaxe_Num: pick,
            Mining_Gem_Num: collected
        });
    }

    reportMiningPickaxeGet(type: number, num: number) {
        const pickNum = MgrUser.Instance.userData.getItem(ITEM.PickAxe) || 0;
        AnalyticsManager.getInstance().reportMiningPickaxeGet({
            Pickaxe_GetType: type,
            Pickaxe_Num: pickNum,
            Pickaxe_GetNum: num
        });
    }

    onEnter() {
        const view = UIPrefabs.MineView;
        if (view) {
            MgrUi.Instance.addViewAsyncQueue(view);
        }
    }

    getUnlockInfo(): string {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.MINE_OPEN_LEVEL.toString());
    }

    getOpenTimeInfo(): string {
        return Language.Instance.getLangByID('WinStreakV2OpenTime');
    }

    getRemainTime(): number {
        return this._remainTime;
    }

    getActiveStatus(): ACTIVE_STATUS {
        if (MgrGame.Instance.gameData.maxLv < GameConst.MINE_OPEN_LEVEL) {
            return ACTIVE_STATUS.LOCK;
        }
        const now = Tools.GetNowTime();
        if (now < (this._data?.recentStartTime ?? 0) || now > (this._data?.recentEndTime ?? 0)) {
            return ACTIVE_STATUS.GAP;
        }
        return ACTIVE_STATUS.ACTIVE;
    }

    hasGuide(): boolean {
        return !!this._data?.tip;
    }

    get data() {
        return this._data!;
    }

    get status() {
        return this._status;
    }

    set status(s: MineActivityStatus) {
        this._status = s;
    }

    get remainTime() {
        return this._remainTime;
    }

    set remainTime(t: number) {
        this._remainTime = t;
        director.emit(GlobalEvent.MineRefreshRemainTime);
    }

    static get Instance() {
        return MgrMine._instance!;
    }
}