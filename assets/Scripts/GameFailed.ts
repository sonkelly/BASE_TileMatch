import { _decorator, Component, Button, Label, director, cclegacy } from 'cc';
import { AppGame } from './AppGame';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrGame, GiveupType } from './MgrGame';
import {AudioPlayer} from './AudioPlayer';
import { GameAudios, UIPrefabs } from './Prefabs';
import { AdsManager } from './AdsManager';
import {Toast} from './Toast';
import {Language} from './Language';
import { LevelReviveType } from './ReportEventEnum';
import { SdkBridge } from './SdkBridge';
import { GlobalEvent } from './Events';
import { ITEM, GameConst } from './GameConst';
import { MgrUser } from './MgrUser';
import {MgrUi} from './MgrUi';
import { MgrChallenge } from './MgrChallenge';
import { StreakFailItem } from './StreakFailItem';
import { GameStaticBg } from './GameStaticBg';
import {LevelCfg} from './LevelCfg';
import { GameMode } from './Const';

const { ccclass, property } = _decorator;

@ccclass('GameFailed')
export class GameFailed extends Component {
    @property(Button)
    btnHome: Button | null = null;

    @property(Button)
    btnReplay: Button | null = null;

    @property(Button)
    btnReviveAd: Button | null = null;

    @property(Button)
    btnReviveCoin: Button | null = null;

    @property(Label)
    coinLabel: Label | null = null;

    @property(StreakFailItem)
    streakClear: StreakFailItem | null = null;

    @property(GameStaticBg)
    gameBg: GameStaticBg | null = null;

    onLoad() {
        this.btnHome!.node.on('click', this.onClickHome, this);
        this.btnReplay!.node.on('click', this.onClickReplay, this);
        this.btnReviveAd!.node.on('click', this.onClickReviveAd, this);
        this.btnReviveCoin!.node.on('click', this.onClickReviveCoin, this);
        AudioPlayer.Instance.playEffect(GameAudios.Fail.url);
    }

    close() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
    }

    onEnable() {
        this.refreshRevive();
        director.on(GlobalEvent.AssetItemChange + ITEM.Coin, this.onCoinChange, this);
        this.streakClear!.showView();
        this.refreshGameBg();
    }

    refreshGameBg() {
        let bgName = '';
        if (AppGame.gameCtrl.currMode == GameMode.Challenge) {
            bgName = 'bg' + GameConst.CHALLENGE_BG_ID;
        } else {
            const level = MgrGame.Instance.gameData.curLv;
            bgName = LevelCfg.Instance.getLevelBg(level);
        }
        if (bgName != this.gameBg!.spriteName) {
            this.gameBg!.changeSprite(bgName);
        }
    }

    refreshRevive() {
        const isAdAvailable = SdkBridge.isRewardVideoAvailable();
        const reviveCount = MgrGame.Instance.getReviveCnt();
        this.btnReviveAd!.node.active = reviveCount == 0 && isAdAvailable;
        this.btnReviveCoin!.node.active = reviveCount == 0 && !isAdAvailable;
        this.coinLabel!.string = '' + GameConst.REVIVE_COIN_COUNT;
    }

    onDisable() {
        director.targetOff(this);
    }

    onCoinChange() {
        this.refreshRevive();
    }

    onSalvageResult(type: GiveupType, success: boolean, reviveType: LevelReviveType) {
        this.close();
        if (success) {
            AppGame.gameCtrl.revive(reviveType);
        } else {
            AppGame.gameCtrl.giveup(type);
        }
    }

    onClickHome() {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            MgrGame.Instance.trySalvage((success, reviveType) => {
                this.onSalvageResult(GiveupType.Home, success, reviveType);
            });
        } else {
            MgrChallenge.Instance.trySalvage((success, reviveType) => {
                this.onSalvageResult(GiveupType.Home, success, reviveType);
            });
        }
    }

    onClickReplay() {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            MgrGame.Instance.trySalvage((success, reviveType) => {
                this.onSalvageResult(GiveupType.Retry, success, reviveType);
            });
        } else {
            MgrChallenge.Instance.trySalvage((success, reviveType) => {
                this.onSalvageResult(GiveupType.Retry, success, reviveType);
            });
        }
    }

    onClickReviveAd() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'FailView',
            AdsType: 'AdRevive',
            onSucceed: () => {
                this.close();
                AppGame.gameCtrl.revive(LevelReviveType.Ad);
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    onClickReviveCoin() {
        this.close();
        if (MgrUser.Instance.userData.subItem(ITEM.Coin, GameConst.REVIVE_COIN_COUNT, { type: 'Revive' })) {
            AppGame.gameCtrl.revive(LevelReviveType.Coin);
        } else {
            AppGame.topUI.setBtnEventEnable(AppGame.topUI.backBtn.node, false);
            MgrUi.Instance.openViewAsync(UIPrefabs.ShopView, {
                root: MgrUi.root(1),
                data: {
                    fromUrl: UIPrefabs.GameFailed.url
                },
                callback: (view) => {
                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                        AppGame.topUI.setBtnEventEnable(AppGame.topUI.backBtn.node, true);
                        MgrUi.Instance.openViewAsync(UIPrefabs.GameFailed);
                        MgrUi.Instance.openViewAsync(UIPrefabs.CollectFreeGold);
                    });
                }
            });
        }
    }
}