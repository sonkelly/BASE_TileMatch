import { _decorator, Button, Node, Label, EditBox, director, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { UserAvatarItem } from './UserAvatarItem';
import {AvatarCfg} from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { GlobalEvent } from './Events';
import {ListView} from './ListView';
import {ListViewAdapter} from './ListViewAdapter';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('UserDetailEditView')
export class UserDetailEditView extends ListViewAdapter {
    @property(Button)
    closeBtn: Button = null!;

    @property(Button)
    confirmBrn: Button = null!;

    @property(Node)
    avatarContent: Node = null!;

    @property(ListView)
    listView: ListView = null!;

    @property(Label)
    goldLabel: Label = null!;

    @property(EditBox)
    editbox: EditBox = null!;

    private _chooseHeadId: number = 0;
    private _inputNick: string = '';

    onLoad() {
        this.closeBtn.node.on('click', this._clickCloseBtn, this);
        this.confirmBrn.node.on('click', this._clickSureBtn, this);
    }

    onEnable() {
        director.on(GlobalEvent.unlockAvatar, this._dealUnlockAvatar, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.Coin, this._freshCoin, this);
        
        this._chooseHeadId = MgrUser.Instance.userData.userHead;
        this._refreshListData();
        this._freshCoin();
        this.editbox.string = MgrUser.Instance.userData.userName;
    }

    onDisable() {
        director.targetOff(this);
    }

    private _freshCoin() {
        this.goldLabel.string = '' + MgrUser.Instance.userData.getItem(ITEM.Coin);
    }

    private _clickCloseBtn() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private _dealUnlockAvatar(headId: number) {
        this._chooseHeadId = headId;
        this._refreshListData();
    }

    private _refreshListData() {
        const avatarArray = AvatarCfg.Instance.getAvatarSortArray();
        this.setDataSet(avatarArray);
        this.listView.setAdapter(this);
        this.listView.getScrollView()!.stopAutoScroll();
        this.listView.getScrollView()!.scrollToTop(0);
    }

    updateView(item: Node, index: number, data: any) {
        item.getComponent(UserAvatarItem)!.init(data, this);
    }

    refreshChooseAvatar(headId: number) {
        this._chooseHeadId = headId;
        director.emit(GlobalEvent.refreshChooseAvatar);
    }

    getChooseHeadId(): number {
        return this._chooseHeadId;
    }

    onEditDidBegan(editbox: EditBox) {}

    onTextChanged(text: string, editbox: EditBox, customEventData: any) {}

    onEditDidEnded(editbox: EditBox) {
        this._inputNick = editbox.string ? editbox.string : '';
    }

    private _clickSureBtn() {
        if (this._chooseHeadId) {
            MgrUser.Instance.userData.setUserHead(this._chooseHeadId);
        }
        if (this._inputNick) {
            MgrUser.Instance.userData.setUserName(this._inputNick);
        }
        this._clickCloseBtn();
    }
}