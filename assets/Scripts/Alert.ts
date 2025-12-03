import { _decorator, Component, Label, Button, director, Director, resources, Prefab, error, Vec3, isValid } from 'cc';
import {Language} from './Language';
import { AssetPool } from './AssetPool';
import {MgrUi} from './MgrUi';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';

const { ccclass, property } = _decorator;

@ccclass('Alert')
export class Alert extends Component {
    @property(Label)
    title: Label | null = null;

    @property(Label)
    message: Label | null = null;

    @property(Button)
    btnOk: Button | null = null;

    @property(Label)
    btnOkStr: Label | null = null;

    @property(Button)
    btnAd: Button | null = null;

    @property(Label)
    btnAdStr: Label | null = null;

    @property(Button)
    btnCancel: Button | null = null;

    @property(Button)
    btnClose: Button | null = null;

    @property(Label)
    btnCancelStr: Label | null = null;

    private _onOkHandler: Function | null = null;
    private _onAdHandler: Function | null = null;
    private _onCancelHandler: Function | null = null;
    private _onCloseHandler: Function | null = null;
    private _showOk: boolean = false;
    private _showAd: boolean = false;
    private _showCancel: boolean = false;
    private _showClose: boolean = false;

    onLoad() {
        this.btnOk?.node.on('click', this.onClickOk, this);
        this.btnAd?.node.on('click', this.onClickAd, this);
        this.btnCancel?.node.on('click', this.onClickCancel, this);
        this.btnClose?.node.on('click', this.onClickClose, this);
    }

    reset() {
        this._showOk = false;
        this._showAd = false;
        this._showCancel = false;
        this._showClose = false;
        this._onOkHandler = null;
        this._onAdHandler = null;
        this._onCancelHandler = null;
        this._onCloseHandler = null;
    }

    setTile(title: string) {
        this.title!.string = title || Language.Instance.getLangByID('common_prompt_tooltip');
    }

    setMessage(message: string) {
        this.message!.string = message;
    }

    onEnable() {
        director.once(Director.EVENT_BEFORE_SCENE_LAUNCH, this.onSceneLaunch, this);
        director.once(Director.EVENT_BEFORE_DRAW, this.refreshAfterScene, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    onSceneLaunch() {
        this.node.emit(VIEW_ANIM_EVENT.Remove);
    }

    refreshAfterScene() {
        this.btnOk!.node.active = this._showOk;
        this.btnAd!.node.active = this._showAd;
        this.btnCancel!.node.active = this._showCancel;
        this.btnClose!.node.active = this._showClose || !this._showOk && !this._showAd && !this._showCancel;
    }

    confirm(onOkHandler: Function, okStr ? : string) {
        this._showOk = true;
        this._onOkHandler = onOkHandler;
        this.btnOkStr!.string = okStr || Language.Instance.getLangByID('ui_ok');
    }

    confirmAd(onAdHandler: Function, adStr: string) {
        this._showAd = true;
        this._onAdHandler = onAdHandler;
        this.btnAdStr!.string = adStr || Language.Instance.getLangByID('ui_ok');
    }

    cancel(onCancelHandler: Function, cancelStr: string) {
        this._showCancel = true;
        this._onCancelHandler = onCancelHandler;
        this.btnCancelStr!.string = cancelStr || Language.Instance.getLangByID('ui_cancel');
    }

    close(onCloseHandler: Function) {
        this._showClose = true;
        this._onCloseHandler = onCloseHandler;
    }

    onClickOk() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
        this.node.once(VIEW_ANIM_EVENT.Removed, () => {
            if (this._onOkHandler) {
                const handler = this._onOkHandler;
                this._onOkHandler = null;
                handler && handler();
            }
        });
    }

    onClickAd() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
        this.node.once(VIEW_ANIM_EVENT.Removed, () => {
            if (this._onAdHandler) {
                const handler = this._onAdHandler;
                this._onAdHandler = null;
                handler && handler();
            }
        });
    }

    onClickCancel() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
        this.node.once(VIEW_ANIM_EVENT.Removed, () => {
            if (this._onCancelHandler) {
                const handler = this._onCancelHandler;
                this._onCancelHandler = null;
                handler && handler();
            }
        });
    }

    onClickClose() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
        this.node.once(VIEW_ANIM_EVENT.Removed, () => {
            if (this._onCloseHandler) {
                const handler = this._onCloseHandler;
                this._onCloseHandler = null;
                handler && handler();
            }
        });
    }

    static load(callback: Function) {
        resources.load('Alert', Prefab, (err, prefab) => {
            if (err) {
                error('load alert error:', err);
            } else {
                AssetPool.Instance.addPrefab(prefab, 'Alert');
                callback && callback();
            }
        });
    }

    static open(message: string, title ?: string) {
        const alertNode = AssetPool.Instance.createObject('Alert');
        alertNode.parent = MgrUi.root();
        alertNode.position = Vec3.ZERO;
        alertNode.once(VIEW_ANIM_EVENT.Remove, (alert: Alert) => {
            if (alert && isValid(alert.node)) {
                alert.node.emit(VIEW_ANIM_EVENT.Removed);
                AssetPool.Instance.put(alert);
            }
        });
        const alert = alertNode.getComponent(Alert);
        alert.reset();
        alert.setTile(title);
        alert.setMessage(message);
        return alert;
    }
}