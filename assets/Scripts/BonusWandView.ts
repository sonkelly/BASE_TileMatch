import { _decorator, Component, UITransform, Label, Sprite, sp, Button, SpriteFrame, tween, easing, cclegacy } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrBonusWand } from './MgrBonusWand';
import { GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';
import { MgrGame } from './MgrGame';
import { Language } from './Language';
import { AppGame } from './AppGame';
import { NativeBridge } from './NativeBridge';

const { ccclass, property } = _decorator;

@ccclass('BonusWandView')
export class BonusWandView extends Component {
    @property(UITransform)
    progressSprite: UITransform = null!;

    @property(Label)
    progressLabel: Label = null!;

    @property(Sprite)
    activeSprite: Sprite = null!;

    @property(sp.Skeleton)
    activeSpine: sp.Skeleton = null!;

    @property(Button)
    continusBtn: Button = null!;

    @property(Label)
    levelIdLabel: Label = null!;

    @property(Button)
    btnRule: Button = null!;

    @property(Sprite)
    gressBarSp: Sprite = null!;

    @property(SpriteFrame)
    orangegress: SpriteFrame = null!;

    @property(SpriteFrame)
    greengress: SpriteFrame = null!;

    private _originWidth: number = 0;
    private _progress: number = -1;

    onLoad() {
        this._originWidth = this.progressSprite.width;
        this.continusBtn.node.on(Button.EventType.CLICK, this.onClickContinus, this);
        this.btnRule.node.on(Button.EventType.CLICK, this.onClickRule, this);
    }

    onClickContinus() {
        AppGame.topUI.clearBackFunc();
        MgrUi.Instance.closeAll();
        MgrGame.Instance.enterLevel();
        NativeBridge.Instance.showInterstitialIfCooldown({
            OpenUi: 'SuperWand'
        });
    }

    onClickRule() {
        MgrUi.Instance.openViewAsync(UIPrefabs.BonusWandRule);
    }

    setProgress(current: number, total: number) {
        this._progress = current / total;
        this.progressSprite.width = this._originWidth * this._progress;
        
        if (current >= total) {
            this.progressLabel.string = Language.Instance.getLangByID('super_activated_hint_tip');
            this.gressBarSp.spriteFrame = this.greengress;
        } else {
            this.progressLabel.string = current + '/' + total;
            this.gressBarSp.spriteFrame = this.orangegress;
        }
        this.refreshActive(current >= total);
    }

    playProgress(from: number, to: number, total: number) {
        this.continusBtn.interactable = false;
        const targetProgress = to / total;
        
        this.node.once(VIEW_ANIM_EVENT.InDone, () => {
            this._progress = targetProgress;
            const targetWidth = this._originWidth * targetProgress;
            
            tween(this.progressSprite)
                .to(0.2 * Math.abs(to - from), { width: targetWidth }, { easing: easing.quadInOut })
                .call(() => {
                    this.continusBtn.interactable = true;
                    this._progress = targetProgress;
                    this.setProgress(to, total);
                    this.refreshActive(this._progress >= 1);
                })
                .start();
        });
    }

    onEnable() {
        const winCount = MgrBonusWand.Instance.winCount;
        const cacheWinCnt = MgrBonusWand.Instance.cacheWinCnt;
        const requiredWins = GameConst.BONUS_WAND_WINCOUNT;
        
        this.setProgress(cacheWinCnt, requiredWins);
        
        if (winCount > cacheWinCnt) {
            this.playProgress(cacheWinCnt, winCount, requiredWins);
            MgrBonusWand.Instance.syncCacheWinCnt();
        } else {
            this.setProgress(winCount, requiredWins);
        }
        
        const currentLevel = MgrGame.Instance.gameData.curLv;
        this.levelIdLabel.string = Language.Instance.getLangByID('Language1').replace('{0}', '' + currentLevel);
        
        if (!MgrBonusWand.Instance.guided) {
            MgrBonusWand.Instance.guided = true;
            MgrUi.Instance.openViewAsync(UIPrefabs.BonusWandRule);
        }
    }

    refreshActive(isActive: boolean) {
        this.activeSprite.node.active = !isActive;
        this.activeSpine.node.active = isActive;
    }
}