import { _decorator, Component, Label, Sprite, Button, director, sys } from 'cc';
import { MgrGame } from './MgrGame';
import { config } from './Config';
import { ViewAnimCtrl, VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import {Language} from './Language';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';
import { MgrDetail } from './MgrDetail';
import { BTN_BACK } from './TopUIView';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import {AvatarCfg} from './AvatarCfg';
import { GlobalEvent } from './Events';
import {toNumber} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('UserDetailView')
export class UserDetailView extends Component {
    @property(Label)
    wisdomPoint: Label | null = null;

    @property(Label)
    completeLv: Label | null = null;

    @property(Label)
    playCnt: Label | null = null;

    @property(Label)
    playDay: Label | null = null;

    @property(Label)
    dailyChallenge: Label | null = null;

    @property(Sprite)
    headSp: Sprite | null = null;

    @property(Label)
    nickLabel: Label | null = null;

    @property(Button)
    editBtn: Button | null = null;

    private _fromUi: string = '';

    onLoad() {
        this.editBtn.node.on('click', this._onClickEdit, this);
    }

    reuse(fromUi: string) {
        this._fromUi = fromUi;
    }

    onEnable() {
        director.on(GlobalEvent.refreshAvatar, this._refreshAvatar, this);
        director.on(GlobalEvent.refreshNick, this._refreshNick, this);
        AppGame.topUI.addBackFunc(() => {
            this._onBackBtn();
            if (this._fromUi === UIPrefabs.TopUI.url) {
                AppGame.topUI.showMain();
            }
        });
        AppGame.topUI.show(BTN_BACK);
        this.freshDetail();
        this._refreshAvatar();
        this._refreshNick();
    }

    onDisable() {
        director.targetOff(this);
    }

    private _onBackBtn() {
        this.node.getComponent(ViewAnimCtrl).onClose();
    }

    private freshDetail() {
        this.wisdomPoint.string = '' + MgrUser.Instance.userData.getItem(ITEM.Wisdom);
        this.completeLv.string = '' + MgrGame.Instance.gameData.maxLv;
        this.playCnt.string = '' + (MgrDetail.Instance.data.playTime || 0);
        this.playDay.string = toNumber(sys.localStorage.getItem(config.gameName + '_playDays') || '1') + ' ' + Language.Instance.getLangByID('Task_Day');
        this.dailyChallenge.string = '' + (MgrDetail.Instance.data.challengeTime || 0);
    }

    private async _refreshAvatar() {
        this.headSp.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(MgrUser.Instance.userData.userHead);
    }

    private _refreshNick() {
        const userName = MgrUser.Instance.userData.userName;
        this.nickLabel.string = userName;
    }

    private async _onClickEdit() {
        this.editBtn.interactable = false;
        const view = await MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailEditView, { priority: 2 });
        view.once(VIEW_ANIM_EVENT.Removed, () => {
            this.editBtn.interactable = true;
        });
    }
}