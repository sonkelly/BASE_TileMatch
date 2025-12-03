import { _decorator, Component, Label, Button, Node, Sprite, SpriteFrame, Vec3, director, macro, Tween, tween, v3, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { UIPrefabs } from './Prefabs';
import { MgrToyRace, ToyRaceState, RaceRewardIdx } from './MgrToyRace';
import { MgrUi } from './MgrUi';
import { Utils } from './Utils';
import { AppGame } from './AppGame';
import { TopUIItem } from './TopUIItem';
import { LanguageEvent } from './Language';

const { ccclass, property } = _decorator;

@ccclass('ToyRaceMenu')
export class ToyRaceMenu extends Component {
    @property(Label)
    remainTimeLabel: Label = null!;

    @property(Button)
    btnMenu: Button = null!;

    @property(Node)
    progressUp: Node = null!;

    @property(Node)
    scaleUpNode: Node = null!;

    @property(Sprite)
    topThreeRankSprite: Sprite = null!;

    @property([SpriteFrame])
    rankBgSpriteFrames: SpriteFrame[] = [];

    @property(Node)
    rankSelfNode: Node = null!;

    @property(Label)
    rankSelfLabel: Label = null!;

    @property(TopUIItem)
    btnToy: TopUIItem = null!;

    private _cacheLvs: number = 0;
    private canClick: boolean = true;
    private _upStartPos: Vec3 = new Vec3();

    static Ins: ToyRaceMenu;

    onLoad() {
        ToyRaceMenu.Ins = this;
        this.btnMenu.node.on(Button.EventType.CLICK, this.onClickMenu, this);
        this._cacheLvs = MgrToyRace.Instance.toyRaceData.players[0]?.levels || 0;
        this.progressUp.active = false;
        this._upStartPos.set(this.progressUp.position);
    }

    onClickMenu() {
        if (this.canClick) {
            this.canClick = false;
            MgrToyRace.Instance.onEnter();
            this.scheduleOnce(() => {
                this.canClick = true;
            }, 0.5);
        }
    }

    onEnable() {
        this.canClick = true;
        this.setVisible(MgrToyRace.Instance.isVisible());
        
        const player = MgrToyRace.Instance.toyRaceData.players[0];
        if (player && MgrToyRace.Instance.toyRaceData.status >= ToyRaceState.InRace && 
            MgrToyRace.Instance.toyRaceData.status < ToyRaceState.Finish) {
            this.setRank(player.levels, player.rank);
        } else {
            this.rankSelfLabel.string = '';
            this.rankSelfNode.active = false;
            this.topThreeRankSprite.spriteFrame = null;
        }

        director.on(GlobalEvent.ToyRaceUnlock, this.onToyUnlock, this);
        director.on(GlobalEvent.ToyRaceEnterGap, this.onEnterGap, this);
        director.on(GlobalEvent.ToyRaceActive, this.onActive, this);
        director.on(GlobalEvent.ToyRaceRankChange, this.onRankChange, this);
        director.on(GlobalEvent.ToyRaceFinish, this.onRankFinish, this);
        director.on(LanguageEvent.CHANGE, this.onLanguageChange, this);
        
        this.schedule(this.fixedUpdate, 1, macro.REPEAT_FOREVER);
    }

    onDisable() {
        director.targetOff(this);
        this.unscheduleAllCallbacks();
    }

    setVisible(visible: boolean) {
        if (visible) {
            this.setTime(MgrToyRace.Instance.getRemainTime());
        }
    }

    onToyUnlock() {
        this.setVisible(true);
        this._cacheLvs = 0;
        this.rankSelfLabel.string = '';
        this.rankSelfNode.active = false;
        this.topThreeRankSprite.spriteFrame = null;
    }

    onEnterGap() {
        this.btnToy.isVisible = false;
        this.btnToy.hide();
        this.setVisible(false);
    }

    onActive() {
        this._cacheLvs = 0;
        this.btnToy.isVisible = true;
        this.btnToy.show();
        this.setVisible(true);
        this.rankSelfLabel.string = '';
        this.rankSelfNode.active = false;
        this.topThreeRankSprite.spriteFrame = null;
    }

    onRankChange() {
        const player = MgrToyRace.Instance.toyRaceData.players[0];
        this.setRank(player.levels, player.rank);
    }

    onRankFinish() {
        this.rankSelfLabel.string = '';
        this.rankSelfNode.active = false;
        this.topThreeRankSprite.spriteFrame = null;
    }

    fixedUpdate(dt: number) {
        if (this.btnMenu.node.active) {
            this.setTime(MgrToyRace.Instance.getRemainTime());
        } else if (MgrToyRace.Instance.toyRaceData.status === ToyRaceState.Gap && 
                   MgrToyRace.Instance.checkoutGap()) {
            AppGame.Ins.addAutoFlow((callback) => {
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRacePrepare, {
                    data: {
                        hideCall: () => {
                            callback && callback();
                        }
                    }
                });
            });
        }
    }

    setTime(time: number) {
        this.remainTimeLabel.string = Utils.timeConvertToHHMM(time);
    }

    playProgress(): boolean {
        const currentLevels = MgrToyRace.Instance.toyRaceData.players[0]?.levels || 0;
        const levelDiff = currentLevels - this._cacheLvs;
        this._cacheLvs = currentLevels;

        if (levelDiff > 0) {
            this.progressUp.active = true;
            Tween.stopAllByTarget(this.progressUp);
            this.progressUp.setPosition(this._upStartPos);
            this.progressUp.scale = Vec3.ZERO;

            tween(this.progressUp)
                .to(0.2, { scale: v3(1, 1, 1) })
                .to(0.1, { scale: v3(0.8, 0.8, 1) })
                .delay(0.4)
                .to(0.2, { position: Vec3.ZERO })
                .to(0.13, { scale: Vec3.ZERO })
                .call(() => {
                    this.progressUp.active = false;
                    tween(this.scaleUpNode)
                        .to(0.1, { scale: new Vec3(1.1, 1.1, 1.1) })
                        .to(0.1, { scale: Vec3.ONE })
                        .start();
                })
                .start();

            return true;
        }
        return false;
    }

    setRank(levels: number, rank: number) {
        if (rank > 0 && levels > 0) {
            this.rankSelfLabel.string = '' + rank;
            if (rank <= RaceRewardIdx) {
                this.topThreeRankSprite.spriteFrame = this.rankBgSpriteFrames[rank - 1];
                this.rankSelfNode.active = false;
            } else {
                this.rankSelfNode.active = true;
                this.topThreeRankSprite.spriteFrame = null;
            }
        } else {
            this.rankSelfLabel.string = '';
            this.rankSelfNode.active = false;
            this.topThreeRankSprite.spriteFrame = null;
        }
    }

    onLanguageChange() {
        if (this.btnMenu.node.active) {
            this.setTime(MgrToyRace.Instance.getRemainTime());
        }
    }
}