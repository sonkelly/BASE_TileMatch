import { _decorator, director, Component } from 'cc';
const { ccclass } = _decorator;

import { GlobalEvent } from './Events';
import MgrGiftPush from './MgrGiftPush';
import { GIFT_TRIGGER_ID, GIFT_PUSH_POS, GameMode } from './Const';
import { ITEM, GameConst } from './GameConst';
import {MgrUser} from './MgrUser';
import {MgrGame} from './MgrGame';
import { config } from './Config';
import {AppGame} from './AppGame';

@ccclass('GameEvents')
export class GameEvents extends Component {
    onLoad() {
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalUndoCount, MgrUser.Instance.userData.getItem(ITEM.Back));
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalHintCount, MgrUser.Instance.userData.getItem(ITEM.Hint));
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalFreshCount, MgrUser.Instance.userData.getItem(ITEM.Fresh));
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalGoldCount, MgrUser.Instance.userData.getItem(ITEM.Coin));
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.PassLevelCount, MgrGame.Instance.gameData.maxLv - 1);
    }

    onEnable() {
        director.on(GlobalEvent.GameUseGoldBuyProp, this.onGameGoldBuyProp, this);
        director.on(GlobalEvent.GameUseAdGetProp, this.onGameAdGetProp, this);
        director.on(GlobalEvent.GameUsePropUndo, this.onGameUseUndo, this);
        director.on(GlobalEvent.GameUsePropTip, this.onGameUseTip, this);
        director.on(GlobalEvent.GameUsePropShuffle, this.onGameUseShuffle, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.Back, this.onItemBackChange, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.Hint, this.onItemHintChange, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.Fresh, this.onItemFreshChange, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.Coin, this.onItemCoinChange, this);
        director.on(GlobalEvent.GameRevive, this.onGameRevive, this);
        director.on(GlobalEvent.GameShowInterstitial, this.onGameShowInterstitial, this);
        director.on(GlobalEvent.GameVictory, this.onGameVictory, this);
        director.on(GlobalEvent.GameFailed, this.onGameFailed, this);
        director.on(GlobalEvent.GameBackHome, this.onGameBackHome, this);
        director.on(GlobalEvent.GameSettleComplete, this.onGameSettleComplete, this);
        director.on(GlobalEvent.CreateComplete, this.onEnterGame, this);
        director.on(GlobalEvent.RestoreComplete, this.onEnterGame, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    onGameGoldBuyProp(item: ITEM | number) {
        if (config.debug) console.log('GameEvents onGameGoldBuyProp', item);
        switch (item) {
            case ITEM.Back:
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.GoldBuyUndo);
                break;
            case ITEM.Hint:
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.GoldBuyHint);
                break;
            case ITEM.Fresh:
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.GoldBuyFresh);
                break;
        }
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.GoldBuyPropCount);
    }

    onGameAdGetProp(item: ITEM | number) {
        if (config.debug) console.log('GameEvents onGameAdGetProp', item);
        switch (item) {
            case ITEM.Back:
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.AdGetUndo);
                break;
            case ITEM.Hint:
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.AdGetHint);
                break;
            case ITEM.Fresh:
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.AdGetFrtesh);
                break;
        }
    }

    onItemBackChange() {
        if (config.debug) console.log('GameEvents onItemBackChange');
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalUndoCount, MgrUser.Instance.userData.getItem(ITEM.Back));
    }

    onItemHintChange() {
        if (config.debug) console.log('GameEvents onItemHintChange');
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalHintCount, MgrUser.Instance.userData.getItem(ITEM.Hint));
    }

    onItemFreshChange() {
        if (config.debug) console.log('GameEvents onItemFreshChange');
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalFreshCount, MgrUser.Instance.userData.getItem(ITEM.Fresh));
    }

    onItemCoinChange(delta: number) {
        if (config.debug) console.log('GameEvents onItemCoinChange');
        if (delta < 0) {
            MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.GoldConsume, Math.abs(delta));
        }
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.FinalGoldCount, MgrUser.Instance.userData.getItem(ITEM.Coin));
    }

    onGameUseUndo() {
        if (config.debug) console.log('GameEvents onGameUseUndo');
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.UseUndo);
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.UsePropCount);
        MgrGiftPush.Instance.triggerPos(GIFT_PUSH_POS.USE_PROP);
    }

    onGameUseTip() {
        if (config.debug) console.log('GameEvents onGameUseTip');
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.UseHint);
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.UsePropCount);
        MgrGiftPush.Instance.triggerPos(GIFT_PUSH_POS.USE_PROP);
    }

    onGameUseShuffle() {
        if (config.debug) console.log('GameEvents onGameUseShuffle');
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.UseFresh);
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.UsePropCount);
        MgrGiftPush.Instance.triggerPos(GIFT_PUSH_POS.USE_PROP);
    }

    onGameRevive() {
        if (config.debug) console.log('GameEvents onGameRevive');
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.ReviveCount);
    }

    onGameShowInterstitial() {
        if (config.debug) console.log('GameEvents onGameShowInterstitial');
        MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.InterstitialCount);
    }

    onGameVictory() {
        if (config.debug) console.log('GameEvents onGameVictory');
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            if (MgrGame.Instance.gameData.curLv == MgrGame.Instance.gameData.maxLv) {
                MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.PassLevelCount, MgrGame.Instance.gameData.maxLv - 1);
                MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.DailyPassLevelCount);
            }
            MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.DailyLevelFailCnt, MgrGame.Instance.gameData.failCnt);
        }
    }

    onGameFailed() {
        if (config.debug) console.log('GameEvents onGameFailed');
        const less = MgrUser.Instance.userData.getItem(ITEM.Coin) < GameConst.REVIVE_COIN_COUNT ? 1 : 0;
        MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.ReviveGoldLess, less);
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            MgrGiftPush.Instance.setTriggerCount(GIFT_TRIGGER_ID.DailyLevelFailCnt, MgrGame.Instance.gameData.failCnt);
            MgrGiftPush.Instance.addTriggerCount(GIFT_TRIGGER_ID.DailyLevelFailTotal, 1);
        }
    }

    onGameBackHome() {
        MgrGiftPush.Instance.triggerPos(GIFT_PUSH_POS.HOME_PAGE);
    }

    onGameSettleComplete() {
        MgrGiftPush.Instance.triggerPos(GIFT_PUSH_POS.SETTLE_COMPLETE);
    }

    onEnterGame() {
        MgrGiftPush.Instance.triggerPos(GIFT_PUSH_POS.ENTER_LEVEL);
    }
}