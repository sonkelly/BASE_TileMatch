import { _decorator, Component, Node, Label, Button, Sprite, Color, director } from 'cc';
import { Language } from './Language';
import { MgrRace, TurnMaxPlayer, RaceState } from './MgrRace';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrUi } from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { GameConst } from './GameConst';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

let yellowColor = new Color();
Color.fromHEX(yellowColor, 'FFF900');
let redColor = new Color()
Color.fromHEX(redColor, 'FF0000');

@ccclass('RaceMatchView')
export class RaceMatchView extends Component {
    @property(Label)
    matchTip: Label | null = null;

    @property(Label)
    playerTip: Label | null = null;

    @property(Label)
    remainTip: Label | null = null;

    @property(Label)
    maxTip: Label | null = null;

    @property(Button)
    matchBtn: Button | null = null;

    @property(Button)
    closeBtn: Button | null = null;

    @property(Node)
    remainCntNode: Node | null = null;

    private _tipRunTime = 0;
    private _searchTipStr = '';
    private _dotCnt = 0;
    private _canMatch = false;
    private _matchRunTime = 0;
    private _matchTriggerTime = 0;
    private _matchPlayer = 0;
    private _closeCall: (() => void) | null = null;

    reuse(data?: any) {
        if (data) {
            this._closeCall = data?.closeCall;
        }
    }

    setCloseCall(call: () => void) {
        this._closeCall = call;
    }

    onLoad() {
        this.matchBtn!.node.on('click', this._autoMatch, this);
        this.closeBtn!.node.on('click', this._onClose, this);
    }

    onEnable() {
        director.on(GlobalEvent.changeRaceState, this._refreshRaceState, this);
        
        this._canMatch = false;
        this.matchBtn!.getComponent(Sprite)!.grayscale = false;
        this.matchBtn!.interactable = true;
        this.maxTip!.string = GameConst.RACE_DAILY_CNT.toString();
        
        const remainCount = GameConst.RACE_DAILY_CNT - MgrRace.Instance.data.raceDayCount;
        this.remainTip!.string = remainCount.toString();
        this.remainTip!.color = remainCount > 0 ? yellowColor : redColor;
        
        this.closeBtn!.node.active = true;
        this.playerTip!.string = '';
        
        if (MgrRace.Instance.data.match) {
            this._handleMatch();
        } else {
            this._autoMatch();
        }
    }

    onDisable() {
        director.targetOff(this);
    }

    update(dt: number) {
        if (!this._canMatch) return;

        this._tipRunTime += dt;
        if (this._tipRunTime >= 0.5) {
            this._tipRunTime = 0;
            this._runSearchTip();
        }

        this._matchRunTime += dt;
        if (this._matchRunTime >= this._matchTriggerTime) {
            this._matchRunTime = 0;
            this._runMatchPlayerStep();
            this._resetMatchTriggerTime();
        }
    }

    private _onClose() {
        this.getComponent(ViewAnimCtrl)!.onClose();
        this._closeCall?.();
    }

    private _autoMatch() {
        this.matchBtn!.node.active = false;
        this.remainCntNode!.active = false;
        this._searchTipStr = Language.Instance.getLangByID('ui_race_search_tip');
        this._tipRunTime = 0;
        this._dotCnt = 0;
        this._matchRunTime = 0;
        this.initMatchPlayer();
        this._runSearchTip();
        this._resetMatchTriggerTime();
        this._canMatch = true;
        this.closeBtn!.node.active = false;
    }

    private _handleMatch() {
        this.matchBtn!.node.active = true;
        this.remainCntNode!.active = true;
        this.matchTip!.string = Language.Instance.getLangByID('ui_race_search_before');
        
        if (MgrRace.Instance.checkDayRaceCountFull()) {
            this.matchBtn!.getComponent(Sprite)!.grayscale = true;
            this.matchBtn!.interactable = false;
        }
    }

    private initMatchPlayer() {
        this._matchPlayer = 1 + Math.floor(5 * Math.random());
        this.playerTip!.string = `${this._matchPlayer}/${TurnMaxPlayer}`;
    }

    private _runSearchTip() {
        this._dotCnt = (this._dotCnt + 1) % 4;
        let dots = '';
        for (let i = 0; i < this._dotCnt; i++) {
            dots += '.';
        }
        this.matchTip!.string = this._searchTipStr + dots;
    }

    private _resetMatchTriggerTime() {
        this._matchTriggerTime = 0.5 + 1.5 * Math.random();
    }

    private _runMatchPlayerStep() {
        this._matchPlayer++;
        if (this._matchPlayer > TurnMaxPlayer) {
            this._canMatch = false;
            this.getComponent(ViewAnimCtrl)!.onClose();
            MgrRace.Instance.data.match = true;
            MgrRace.Instance.matchNewTurn();
            
            MgrUi.Instance.openViewAsync(UIPrefabs.RaceView, {
                data: {
                    closeCall: () => {
                        this._closeCall?.();
                    }
                }
            });
        } else {
            this.playerTip!.string = `${this._matchPlayer}/${TurnMaxPlayer}`;
        }
    }

    private _refreshRaceState() {
        if (MgrRace.Instance.raceState === RaceState.None) {
            this._onClose();
        }
    }
}