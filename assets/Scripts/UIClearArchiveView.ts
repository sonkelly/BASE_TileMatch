import { _decorator, Component, Button, Node } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {StorageProxy} from './StorageProxy';
import {Loading} from './Loading';
import {SdkBridge} from './SdkBridge';

const { ccclass, property } = _decorator;

@ccclass('UIClearArchiveView')
export class UIClearArchiveView extends Component {
    @property(Button)
    btn_no: Button = null!;

    @property(Button)
    btn_yes: Button = null!;

    onLoad() {
        this.btn_no.node.on('click', this.onClose, this);
        this.btn_yes.node.on('click', this.onDelete, this);
    }

    onClose() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    async onDelete() {
        Loading.open();
        await StorageProxy.clearStorage();
        
        this.scheduleOnce(() => {
            SdkBridge.quitGame();
            Loading.close();
            this.node.getComponent(ViewAnimCtrl)!.onClose();
        }, 4);
    }
}