import { _decorator, Button, Node, Sprite, sp, Label, SpriteFrame, Vec3, director, Tween, tween, v3, Component } from 'cc';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import {MgrBonusWand} from './MgrBonusWand';
import { GlobalEvent } from './Events';
import { GameConst } from './GameConst';
import { LanguageEvent } from './Language';
import {Language} from './Language';

const { ccclass, property } = _decorator;

@ccclass('BonusWandMenu')
export class BonusWandMenu extends Component {
    public static Ins: BonusWandMenu = null!;

    @property(Button)
    btnMenu: Button = null!;

    @property(Node)
    progressUp: Node = null!;

    @property(Node)
    scaleUpNode: Node = null!;

    @property(Sprite)
    noticeSp: Sprite = null!;

    @property(sp.Skeleton)
    noticeSpine: sp.Skeleton = null!;

    @property(Label)
    winCountLabel: Label = null!;

    @property(Sprite)
    titleBgSp: Sprite = null!;

    @property(SpriteFrame)
    grayBgSp: SpriteFrame = null!;

    @property(SpriteFrame)
    greenBgSp: SpriteFrame = null!;

    private _cacheCount: number = 0;
    private _upStartPos: Vec3 = new Vec3();

    onLoad() {
        BonusWandMenu.Ins = this;
        this.btnMenu.node.on(Button.EventType.CLICK, this.onClickMenu, this);
        this._cacheCount = MgrBonusWand.Instance.winCount;
        this.progressUp.active = false;
        this._upStartPos.set(this.progressUp.position);
    }

    start() {
        this.setWinCnt(this._cacheCount);
        this.refreshNotice(this._cacheCount);
    }

    onClickMenu() {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.BonusWandView, {
            root: MgrUi.root(2)
        });
    }

    onEnable() {
        director.on(GlobalEvent.BonusWandClear, this.onClearEvent, this);
        director.on(GlobalEvent.BonusWandRevive, this.onReveiveEvent, this);
        director.on(LanguageEvent.CHANGE, this.onLanguageChange, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    onClearEvent() {
        this.setWinCnt(MgrBonusWand.Instance.winCount);
        this.refreshNotice(MgrBonusWand.Instance.winCount);
    }

    onReveiveEvent() {
        this.setWinCnt(MgrBonusWand.Instance.winCount);
        this.refreshNotice(MgrBonusWand.Instance.winCount);
    }

    playProgress(): boolean {
        const winCount = MgrBonusWand.Instance.winCount;
        
        if (this._cacheCount > winCount || (this._cacheCount === 1 && winCount === 1)) {
            this._cacheCount = 0;
        }

        if (winCount - this._cacheCount > 0) {
            this.progressUp.active = true;
            Tween.stopAllByTarget(this.progressUp);
            this.progressUp.position = this._upStartPos;
            this.progressUp.scale = Vec3.ZERO;
            this.setWinCnt(this._cacheCount);
            this.refreshNotice(this._cacheCount);
            this._cacheCount = winCount;

            tween(this.progressUp)
                .to(0.2, { scale: v3(1.2, 1.2, 1.2) })
                .to(0.1, { scale: Vec3.ONE })
                .delay(0.4)
                .to(0.2, { position: Vec3.ONE })
                .to(0.13, { scale: Vec3.ZERO })
                .call(() => {
                    this.progressUp.active = false;
                    this.refreshNotice(winCount);
                    this.setWinCnt(winCount);
                    
                    tween(this.scaleUpNode)
                        .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })
                        .to(0.1, { scale: Vec3.ONE })
                        .start();
                })
                .start();

            return true;
        } else {
            this._cacheCount = winCount;
            return false;
        }
    }

    refreshNotice(count: number) {
        this.noticeSp.node.active = count < GameConst.BONUS_WAND_WINCOUNT;
        this.noticeSpine.node.active = count >= GameConst.BONUS_WAND_WINCOUNT;
    }

    setWinCnt(count: number) {
        if (count >= GameConst.BONUS_WAND_WINCOUNT) {
            this.winCountLabel.string = Language.Instance.getLangByID('super_activated_hint_tip');
            this.titleBgSp.spriteFrame = this.greenBgSp;
        } else {
            count = Math.max(count, 0);
            this.winCountLabel.string = `${count}/${GameConst.BONUS_WAND_WINCOUNT}`;
            this.titleBgSp.spriteFrame = this.grayBgSp;
        }
    }

    onLanguageChange() {
        this.setWinCnt(MgrBonusWand.Instance.winCount);
    }
}