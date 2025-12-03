import { _decorator, Component, EditBox, Button, Label, director, sys } from 'cc';
import { MgrGame } from './MgrGame';
import { AppGame } from './AppGame';
import {MgrUi} from './MgrUi';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { GlobalEvent } from './Events';
import {Toast} from './Toast';
import { MgrUser } from './MgrUser';
import { GmMgr } from './GMManager';
import { MgrTask } from './MgrTask';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { MgrGoldTournament } from './MgrGoldTournament';
import NotifyContentCfg from './NotifyContentCfg';
import {Language} from './Language';
import {NotificationMgr} from './NotificationMgr';
import {Tools} from './Tools';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import {StorageProxy} from './StorageProxy';
import { MgrMine } from './MgrMine';
import {parseInt} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GMView')
export class GMView extends Component {
    @property(EditBox)
    edit: EditBox | null = null;

    @property(Button)
    btnStart: Button | null = null;

    @property(Button)
    btnJump: Button | null = null;

    @property(Button)
    btnDifficulty: Button | null = null;

    @property(Button)
    btnAddItem: Button | null = null;

    @property(Button)
    btnTask: Button | null = null;

    @property(Button)
    btnStreak: Button | null = null;

    @property(Button)
    btnGameGm: Button | null = null;

    @property(Label)
    labelGameGm: Label | null = null;

    @property(Button)
    btnAddGoldCube: Button | null = null;

    @property(Button)
    btnClearStorage: Button | null = null;

    @property(Button)
    btnMineStageMap: Button | null = null;

    @property(EditBox)
    notifyEdit: EditBox | null = null;

    @property(Button)
    btnCreateNotify: Button | null = null;

    @property(Button)
    btnCancelNotify: Button | null = null;

    @property(Button)
    btnCancelAllNotify: Button | null = null;

    onLoad() {
        this.btnStart!.node.on('click', this.onClickStart, this);
        this.btnJump!.node.on('click', this.onClickJump, this);
        this.btnDifficulty!.node.on('click', this.onClickDifficulty, this);
        this.btnAddItem!.node.on('click', this.onClickAddItem, this);
        this.btnGameGm!.node.on('click', this.onClickGameGm, this);
        this.btnTask!.node.on('click', this.onClickTask, this);
        this.btnStreak!.node.on('click', this.onClickStreak, this);
        this.btnAddGoldCube!.node.on('click', this.onClickAddGoldCube, this);
        this.btnClearStorage!.node.on('click', this._clearStorage, this);
        this.btnMineStageMap!.node.on('click', this._onBtnMineStageMap, this);
        this.btnCreateNotify!.node.on('click', this._onBtnCreateNotify, this);
        this.btnCancelNotify!.node.on('click', this._onBtnCancelNotify, this);
        this.btnCancelAllNotify!.node.on('click', this._onBtnCancelAllNotify, this);
    }

    onEnable() {
        AppGame.topUI.addBackFunc(() => {
            this.node.emit(VIEW_ANIM_EVENT.Close);
            AppGame.topUI.showMain();
        }, true);
        AppGame.topUI.show();

        const inGameGm = GmMgr.getInGameGm();
        this.labelGameGm!.string = 'Gm ' + (inGameGm ? 'ON' : 'OFF');
    }

    onClickStart() {
        const levelId = this.edit!.string;
        if (levelId !== '') {
            MgrGame.Instance.loadLevelCfg(levelId).then((cfg) => {
                if (cfg != null) {
                    AppGame.topUI.clearBackFunc();
                    MgrUi.Instance.closeAll();
                }
            });
        }
    }

    onClickJump() {
        const level = parseInt(this.edit!.string);
        if (level != null && level >= 1) {
            MgrGame.Instance.gameData.curLv = level;
            MgrGame.Instance.gameData.maxLv = Math.max(level, MgrGame.Instance.gameData.maxLv);
            director.emit(GlobalEvent.ChangeLevel);
        }
    }

    onClickDifficulty() {
        const difficulty = parseInt(this.edit!.string);
        if (difficulty != null && difficulty >= 1) {
            MgrGame.Instance.gameData.difficulty = difficulty;
        }
    }

    onClickAddItem() {
        const parts = this.edit!.string.split(' ');
        if (parts.length === 2) {
            MgrUser.Instance.userData.addItem(Number(parts[0]), Number(parts[1]));
            Toast.tip('物品添加完成');
        } else {
            Toast.tip('输入异常，请重新输入物品 数量');
        }
    }

    onClickTask() {
        const parts = this.edit!.string.split(' ');
        if (parts.length === 2) {
            MgrTask.Instance.data.addTaskData(Number(parts[0]), Number(parts[1]));
            Toast.tip('任务数据添加完成');
        } else {
            Toast.tip('输入异常，请重新输入任务类型 次数');
        }
    }

    onClickStreak() {
        const time = this.edit!.string;
        MgrWinStreak.Instance.addStreakTime(Number(time));
        MgrWinStreakV2.Instance.addStreakTime(Number(time));
    }

    onClickAddGoldCube() {
        const count = parseInt(this.edit!.string);
        MgrGoldTournament.Instance.addGoldCubeCnt(count!);
        MgrGoldTournamentV2.Instance.addGoldCubeCnt(count!);
    }

    onClickGameGm() {
        const inGameGm = GmMgr.getInGameGm();
        GmMgr.setInGameGm(!inGameGm);
        this.labelGameGm!.string = 'Gm ' + (inGameGm ? 'OFF' : 'ON');
    }

    _onBtnCreateNotify() {
        const parts = this.notifyEdit!.string.split(' ');
        if (parts.length < 2) {
            Toast.tip('请重新输入：通知内容编号 首次延迟时间 重复时间（若需要重复通知）');
            return;
        }

        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        const notifyId = Number(parts[0]);
        const delayTime = Number(parts[1]);
        const repeatTime = Number(parts[2]) || 0;

        const notifyCfg = NotifyContentCfg.Instance.get(notifyId);
        const title = Language.Instance.getLangByID(notifyCfg.title);
        const message = Language.Instance.getLangByID(notifyCfg.message);

        if (sys.platform === sys.Platform.ANDROID) {
            const triggerTime = Tools.GetNowTime() + 1000 * delayTime * 60;
            const repeatInterval = 1000 * repeatTime * 60;
            NotificationMgr.Instance.scheduleAndroidLocalNotification(title, message, triggerTime, repeatInterval);
        } else if (sys.platform === sys.Platform.IOS) {
            // iOS notification implementation
        }
    }

    _onBtnCancelNotify() {
        const parts = this.notifyEdit!.string.split(' ');
        if (parts.length !== 1) {
            Toast.tip('请重新输入通知内容编号');
            return;
        }

        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        const notifyId = Number(parts[0]);
        if (sys.platform === sys.Platform.ANDROID) {
            NotificationMgr.Instance.cancelNotificationById(notifyId);
        } else if (sys.platform === sys.Platform.IOS) {
            // iOS notification cancellation
        }
    }

    _onBtnCancelAllNotify() {
        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        if (sys.platform === sys.Platform.ANDROID) {
            NotificationMgr.Instance.cancelAllNotification();
        } else if (sys.platform === sys.Platform.IOS) {
            // iOS notification cancellation
        }
    }

    _clearStorage() {
        if (StorageProxy.clearStorage()) {
            Toast.tip('清除数据成功！');
        }
    }

    _onBtnMineStageMap() {
        const parts = this.edit!.string.split(' ');
        if (parts.length < 2) {
            Toast.tip('请输入关卡ID 地图ID');
            return;
        }

        const stageId = Number(parts[0]);
        const mapId = Number(parts[1]);
        
        if (Math.floor(mapId / 10) === stageId) {
            MgrMine.Instance.setStageAndMap(stageId, mapId);
        } else {
            Toast.tip('关卡和地图ID 不匹配！');
        }
    }
}