import { _decorator, Component, Button, NodeEventType, CCBoolean, AudioClip } from 'cc';
import { AudioPlayer } from './AudioPlayer';
import { GameAudios } from './Prefabs';

const { ccclass, property, menu } = _decorator;

@ccclass('ButtonAudio')
@menu('Button/ButtonAudio')
export class ButtonAudio extends Component {
    @property
    useCustonAudio = false;

    @property({
        type: AudioClip,
        visible: function (this: ButtonAudio) {
            return this.useCustonAudio;
        }
    })
    clickAduio: AudioClip | null = null;

    onLoad() {
        const button = this.node.getComponent(Button);
        if (button) {
            this.node.on('click', this.onClick, this);
        } else {
            this.node.on(NodeEventType.TOUCH_END, this.onClick, this);
        }
    }

    onClick() {
        if (!this.enabled) return;
        
        if (this.useCustonAudio && this.clickAduio) {
            AudioPlayer.Instance.playAudio(this.clickAduio);
        } else {
            AudioPlayer.Instance.playEffect(GameAudios.Button2.url);
        }
    }
}