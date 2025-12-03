import { _decorator, Component, Button, director, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import {Toast} from './Toast';
import { MgrChallenge } from './MgrChallenge';
import { MgrGame } from './MgrGame';
import {MgrUi} from './MgrUi';
import { AppGame } from './AppGame';
import { GameMode } from './Const';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass, property } = _decorator;

@ccclass('GMOptions')
export class GMOptions extends Component {
    @property(Button)
    btnNext: Button | null = null;

    @property(Button)
    btnPre: Button | null = null;

    @property(Button)
    btnRotate: Button | null = null;

    @property(Button)
    btnSave: Button | null = null;

    @property(Button)
    btnReset: Button | null = null;

    @property(Button)
    btnStat: Button | null = null;

    @property(Button)
    btnVictory: Button | null = null;

    onLoad() {
        if(!this.btnNext) return;
        this.btnNext!.node.on('click', this._onClickNext, this);
        this.btnPre!.node.on('click', this._onClickPre, this);
        this.btnRotate!.node.on('click', this._onClickGMRotate, this);
        this.btnSave!.node.on('click', this._onClickGMSave, this);
        this.btnReset!.node.on('click', this._onClickGmReset, this);
        this.btnStat!.node.on('click', this._onClickGmStat, this);
        this.btnVictory!.node.on('click', this._onClickGmVictory, this);
    }

    private _onClickNext() {
        MgrGame.Instance.orientation = 0;
        
        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            const currentTime = MgrChallenge.Instance.curTime;
            const nextDay = moment(currentTime).add(1, 'days');
            const level = MgrChallenge.Instance.getLevelByDate(nextDay);
            
            MgrChallenge.Instance.curLv = level;
            MgrChallenge.Instance.curTime = nextDay;
        } else {
            MgrGame.Instance.gameData.addGameLevel();
            MgrGame.Instance.clearMap();
            AppGame.topUI.goldCubeBtn.hideGoldCube();
            AppGame.topUI.tileCoinBtn.hideTileCoins();
            
            const gameMode = MgrGame.Instance.getGameMode(MgrGame.Instance.gameData.curLv);
            AppGame.gameCtrl.currMode = gameMode;
            AppGame.gameCtrl.curLogic = AppGame.gameCtrl.getLogic(gameMode);
        }

        AppGame.gameCtrl.replay();
        director.emit(GlobalEvent.ChangeLevel);
        AppGame.gameCtrl.collector.reInitAdAddBox();
    }

    private _onClickPre() {
        MgrGame.Instance.orientation = 0;
        
        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            const currentTime = MgrChallenge.Instance.curTime;
            const previousDay = moment(currentTime).subtract(1, 'days');
            const level = MgrChallenge.Instance.getLevelByDate(previousDay);
            
            MgrChallenge.Instance.curLv = level;
            MgrChallenge.Instance.curTime = previousDay;
        } else {
            if (MgrGame.Instance.gameData.curLv <= 1) {
                return;
            }
            
            MgrGame.Instance.gameData.curLv--;
            MgrGame.Instance.clearMap();
            AppGame.topUI.goldCubeBtn.hideGoldCube();
            AppGame.topUI.tileCoinBtn.hideTileCoins();
            
            const gameMode = MgrGame.Instance.getGameMode(MgrGame.Instance.gameData.curLv);
            AppGame.gameCtrl.currMode = gameMode;
            AppGame.gameCtrl.curLogic = AppGame.gameCtrl.getLogic(gameMode);
        }

        AppGame.gameCtrl.replay();
        director.emit(GlobalEvent.ChangeLevel);
        AppGame.gameCtrl.collector.reInitAdAddBox();
    }

    private _onClickGMRotate() {
        MgrGame.Instance.orientation = (MgrGame.Instance.orientation + 90) % 360;
        AppGame.gameCtrl.replay();
        director.emit(GlobalEvent.ChangeLevel);
    }

    private _onClickGMSave() {
        if (MgrGame.Instance.orientation % 360 !== 0) {
            Toast.tip('请在编辑器/预览环境中使用！');
        } else {
            Toast.tip('旋转角度为0;');
        }
    }

    private _onClickGmReset() {
        MgrGame.Instance.orientation = 0;
        AppGame.gameCtrl.replay();
        director.emit(GlobalEvent.ChangeLevel);
    }

    private async _onClickGmStat() {
        const viewPath = 'UI/Prefabs/GM/GMStatView';
        
        if (MgrUi.Instance.hasView(viewPath)) {
            MgrUi.Instance.closeView(viewPath);
        } else {
            await MgrUi.Instance.openViewAsync({
                url: viewPath
            }, {
                root: MgrUi.root(2)
            });
        }
    }

    private _onClickGmVictory() {
        AppGame.gameCtrl.victory();
    }
}