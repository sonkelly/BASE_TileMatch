import { _decorator, Node, Prefab, Label, Button, sp, instantiate, macro, director, Component, cclegacy } from 'cc';
import { config } from './Config';
import { GlobalEvent } from './Events';
import { GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import { AsyncQueue } from './AsyncQueue';
import { Language } from './Language';
import { RaceRewardIdx } from './MgrRace';
import { MgrToyRace, ToyRaceState } from './MgrToyRace';
import { MgrUi } from './MgrUi';
import { Utils } from './Utils';
import { AppGame } from './AppGame';
import { ToyRaceViewItem } from './ToyRaceViewItem';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

const giftNames = ['box3', 'box2', 'box1'];

@ccclass('ToyRaceView')
export class ToyRaceView extends Component {
    @property(Node)
    raceRoot: Node | null = null;

    @property(Prefab)
    raceItemPrefab: Prefab | null = null;

    @property(Label)
    remainTimeLabel: Label | null = null;

    @property(Label)
    descLabel: Label | null = null;

    @property(Button)
    ruleBtn: Button | null = null;

    @property([sp.Skeleton])
    giftSpines: sp.Skeleton[] = [];

    @property(Button)
    btnClose: Button | null = null;

    private _hideCall: (() => void) | null = null;
    private _guideCall: (() => void) | null = null;
    private _raceItems: ToyRaceViewItem[] = [];
    private _async: AsyncQueue = new AsyncQueue();

    onLoad() {
        this.inteRaceItems();
        this.ruleBtn!.node.on(Button.EventType.CLICK, this.onClickRule, this);
        this.btnClose!.node.on(Button.EventType.CLICK, this.onClickClose, this);
    }

    reuse(data: any) {
        if (data) {
            this._hideCall = data.hideCall;
            this._guideCall = data.guideCall;
        }
    }

    onClickClose() {
        this._hideCall?.();
        this._guideCall?.();
        this.node.emit('Close');
    }

    inteRaceItems() {
        for (let i = 0; i < GameConst.ToyRaceMatchCount; i++) {
            const itemNode = instantiate(this.raceItemPrefab!);
            itemNode.parent = this.raceRoot;
            const itemComp = itemNode.getComponent(ToyRaceViewItem)!;
            itemComp.itemIndex = i;
            this._raceItems.push(itemComp);
        }
    }

    onClickRule() {
        MgrUi.Instance.openViewAsync(UIPrefabs.ToyRaceRule);
    }

    onEnable() {
        AppGame.Ins.checkNetwork();
        
        if (MgrToyRace.Instance.toyRaceData.status === ToyRaceState.Idle) {
            if (MgrToyRace.Instance.toyRaceData.matchCount === 0 && 
                MgrToyRace.Instance.toyRaceData.openCount === 1) {
                MgrUi.Instance.openViewAsync(UIPrefabs.ToyRaceRule);
            }
            MgrToyRace.Instance.startMatch();
        }

        this.showGiftResult();

        const mainPlayer = MgrToyRace.Instance.toyRaceData.players[0];
        this.refreshDesc(MgrToyRace.Instance.toyRaceData.status, mainPlayer?.rank || 0);
        this.setTime(MgrToyRace.Instance.getRemainTime());
        
        this.schedule(this.fixedUpdate, 1, macro.REPEAT_FOREVER);
        this._async.clear();

        director.on(GlobalEvent.ToyRaceMatchPlayer, this.onMatchPlayer, this);
        director.on(GlobalEvent.ToyRaceRefreshAIProgress, this.onAiRefreshProgress, this);
        director.on(GlobalEvent.ToyRaceSettle, this.onSettleEvent, this);

        this._async.push((next) => {
            let completed = 0;
            const completeCallback = () => {
                completed++;
                if (completed === this._raceItems.length) {
                    next();
                }
            };

            for (let i = 0; i < this._raceItems.length; i++) {
                const player = MgrToyRace.Instance.toyRaceData.players[i];
                const item = this._raceItems[i];
                
                if (player) {
                    item.showPlayer(player);
                    if (i === 0 && MgrToyRace.Instance.toyRaceData.status === ToyRaceState.Matching) {
                        item.playMatched(player, completeCallback);
                    } else if (player.cacheLvs < player.levels) {
                        item.playRace(player, () => {
                            this.tryGiftOpen(player, completeCallback);
                        });
                    } else {
                        item.setRace(player);
                        completeCallback();
                    }
                } else {
                    item.showWaitMatch();
                    completeCallback();
                }
            }
            MgrToyRace.Instance.syncCacheLvs();
        });

        if (MgrToyRace.Instance.toyRaceData.status === ToyRaceState.Result) {
            this._async.push((next) => {
                const mainPlayer = MgrToyRace.Instance.toyRaceData.players[0];
                if (mainPlayer.rank <= RaceRewardIdx) {
                    MgrToyRace.Instance.receiveReward();
                } else {
                    MgrToyRace.Instance.settle();
                }
                next();
            });
        }

        this._async.play();

        if (config.debug) {
            console.log('ToyRace aiCfgId:', MgrToyRace.Instance.toyRaceData.aiCfgId);
            console.log('ToyRace players:');
            console.log(JSON.stringify(MgrToyRace.Instance.toyRaceData.players));
        }
    }

    onDisable() {
        director.targetOff(this);
        this.unscheduleAllCallbacks();
        
        switch (MgrToyRace.Instance.toyRaceData.status) {
            case ToyRaceState.Matching:
                MgrToyRace.Instance.matchAll();
                break;
            case ToyRaceState.Finish:
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRaceNextTip);
                break;
        }
        
        this._hideCall = null;
    }

    fixedUpdate() {
        this.setTime(MgrToyRace.Instance.getRemainTime());
    }

    onMatchPlayer() {
        const lastIndex = MgrToyRace.Instance.toyRaceData.players.length - 1;
        const player = MgrToyRace.Instance.toyRaceData.players[lastIndex];
        const item = this._raceItems[lastIndex];
        
        item.showPlayer(player);
        item.playMatched(player);
    }

    onAiRefreshProgress() {
        this.refreshProgress();
    }

    onSettleEvent() {
        this._async.push((next) => {
            const mainPlayer = MgrToyRace.Instance.toyRaceData.players[0];
            this.refreshDesc(MgrToyRace.Instance.toyRaceData.status, mainPlayer.rank);
            
            if (mainPlayer.rank <= RaceRewardIdx) {
                MgrToyRace.Instance.receiveReward();
            } else {
                MgrToyRace.Instance.settle();
            }
            next();
        });
        this._async.play();
    }

    refreshProgress() {
        this._async.push((next) => {
            let completed = 0;
            const completeCallback = () => {
                completed++;
                if (completed === MgrToyRace.Instance.toyRaceData.players.length) {
                    next();
                }
            };

            for (let i = 0; i < MgrToyRace.Instance.toyRaceData.players.length; i++) {
                const player = MgrToyRace.Instance.toyRaceData.players[i];
                const item = this._raceItems[i];
                
                if (player.cacheLvs < player.levels) {
                    item.playRace(player, () => {
                        this.tryGiftOpen(player, completeCallback);
                    });
                } else {
                    item.setRace(player);
                    completeCallback();
                }
            }
            MgrToyRace.Instance.syncCacheLvs();
        });
        this._async.play();
    }

    setTime(time: number) {
        this.remainTimeLabel!.string = Utils.timeConvertToHHMM(time);
    }

    refreshDesc(status: ToyRaceState, rank: number) {
        if (status === ToyRaceState.Result) {
            this.descLabel!.string = rank <= RaceRewardIdx ? 
                Language.Instance.getLangByID('ToyRaceSuccessDesc') || 'ToyRaceSuccessDesc' : 
                Language.Instance.getLangByID('ToyRaceFailedDesc') || 'ToyRaceFailedDesc';
        } else {
            this.descLabel!.string = Language.Instance.getLangByID('ToyRaceDesc') || 'ToyRaceDesc';
        }
    }

    showGiftResult() {
        each(this.giftSpines, (spine, index) => {
            this.playGiftIdle(index);
        });

        for (let i = 1; i < MgrToyRace.Instance.toyRaceData.players.length; i++) {
            const player = MgrToyRace.Instance.toyRaceData.players[i];
            if (player.levels === GameConst.ToyRaceMaxProgress && 
                player.rank <= RaceRewardIdx && 
                player.cacheLvs === player.levels) {
                this.playGiftOpenIdle(player.rank - 1);
            }
        }
    }

    tryGiftOpen(player: any, callback: (() => void) | null) {
        if (player.levels === GameConst.ToyRaceMaxProgress && player.rank <= RaceRewardIdx) {
            this.playGiftOpen(player.rank - 1, callback);
        } else {
            callback?.();
        }
    }

    playGiftIdle(index: number) {
        this.giftSpines[index].setAnimation(0, `${giftNames[index]}_loop`, true);
    }

    playGiftOpenIdle(index: number) {
        this.giftSpines[index].setAnimation(0, `${giftNames[index]}_open_idle`, true);
    }

    playGiftOpen(index: number, callback: (() => void) | null) {
        const spine = this.giftSpines[index];
        spine.setAnimation(0, `${giftNames[index]}_open`, false);
        spine.setCompleteListener(() => {
            this.playGiftOpenIdle(index);
            callback?.();
            spine.setCompleteListener(null);
        });
    }
}