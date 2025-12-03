import { _decorator, Component, Button, Label, director, cclegacy } from 'cc';
import { SetSwitch } from './SetSwitch';
import { config } from './Config';
import { AudioPlayer } from './AudioPlayer';
import { AppGame } from './AppGame';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { BTN_BACK } from './TopUIView';
import { LanguageEvent, Language } from './Language';
import { MgrUi } from './MgrUi';
import { UIPrefabs } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('UISettingView')
export class UISettingView extends Component {
    @property(SetSwitch)
    soundSwitch: SetSwitch = null!;

    @property(SetSwitch)
    musicSwitch: SetSwitch = null!;

    @property(SetSwitch)
    vibrationSwitch: SetSwitch = null!;

    @property(Button)
    lgeBtn: Button = null!;

    @property(Button)
    termsBtn: Button = null!;

    @property(Button)
    policyBtn: Button = null!;

    @property(Button)
    clearDataBtn: Button = null!;

    @property(Label)
    versionLabel: Label = null!;

    onEnable() {
        this.topUIAnim();
        director.on(LanguageEvent.CHANGE, this.showVersion, this);
        this.soundSwitch.setSwitch(AudioPlayer.Instance.soundSwitch);
        this.musicSwitch.setSwitch(AudioPlayer.Instance.musicSwitch);
        this.vibrationSwitch.setSwitch(AudioPlayer.Instance.vibrationSwitch);
        this.showVersion();
    }

    showVersion() {
        const baseVersionSuffix = config.baseVersion === 0 ? '' : '.' + config.baseVersion;
        this.versionLabel.string = config.debug 
            ? Language.Instance.getLangByID('version') + ' ' + config.version + baseVersionSuffix
            : Language.Instance.getLangByID('version') + ' ' + config.version;
    }

    topUIAnim() {
        const self = this;
        AppGame.topUI.addBackFunc(() => {
            self.node.getComponent(ViewAnimCtrl)!.onClose();
            AppGame.topUI.showMain();
        });
        AppGame.topUI.show(BTN_BACK);
    }

    onDisable() {
        director.targetOff(this);
    }

    onLoad() {
        this.soundSwitch.node.on('click', this.onSoundSwitch, this);
        this.musicSwitch.node.on('click', this.onMusicSwitch, this);
        this.vibrationSwitch.node.on('click', this.onVibrationSwitch, this);
        this.clearDataBtn.node.on('click', this.onClearData, this);
        this.lgeBtn.node.on('click', this.onLanguageClick, this);
        this.termsBtn.node.on('click', this.onTerms, this);
        this.policyBtn.node.on('click', this.onPolicy, this);
    }

    onMusicSwitch() {
        const currentState = AudioPlayer.Instance.musicSwitch;
        AudioPlayer.Instance.setMusicSwitch(!currentState);
        this.musicSwitch.setSwitch(AudioPlayer.Instance.musicSwitch);
    }

    onSoundSwitch() {
        const currentState = AudioPlayer.Instance.soundSwitch;
        AudioPlayer.Instance.setSoundSwitch(!currentState);
        this.soundSwitch.setSwitch(AudioPlayer.Instance.soundSwitch);
    }

    onVibrationSwitch() {
        const currentState = AudioPlayer.Instance.vibrationSwitch;
        AudioPlayer.Instance.setVibration(!currentState);
        this.vibrationSwitch.setSwitch(AudioPlayer.Instance.vibrationSwitch);
    }

    onClearData() {
        MgrUi.Instance.openViewAsync(UIPrefabs.ClearArchiveView, {
            root: MgrUi.root(2)
        });
    }

    onLanguageClick() {
        MgrUi.Instance.openViewAsync(UIPrefabs.ChangeLanguage, {
            root: MgrUi.root(2)
        });
    }

    onTerms() {}

    onPolicy() {}
}