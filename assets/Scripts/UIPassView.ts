import { _decorator, Component, Label, ProgressBar, Button, director, Node } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import {ListView} from './ListView';
import {ListViewAdapter} from './ListViewAdapter';
import PassCfg from './PassCfg';
import { passItem } from './passItem';
import { MgrPass } from './MgrPass';
import { LanguageEvent, Language } from './Language';
import { MgrUi } from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { MgrGame } from './MgrGame';
import { Utils } from './Utils';
import { NativeBridge } from './NativeBridge';
import { Tools } from './Tools';
import lodash from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('UIPassView')
export class UIPassView extends Component implements ListViewAdapter {
    @property(Label)
    weekLabel: Label | null = null;

    @property(ProgressBar)
    passProgress: ProgressBar | null = null;

    @property(Label)
    progressLabel: Label | null = null;

    @property(Label)
    passLabel: Label | null = null;

    @property(Label)
    passTips: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(ListView)
    list: ListView | null = null;

    @property(Button)
    startBtn: Button | null = null;

    @property(Label)
    lvLabel: Label | null = null;

    private datas: any[] | null = null;

    onLoad() {
        this.startBtn!.node.on('click', this.onStartBtn, this);
    }

    onEnable() {
        MgrPass.Instance.data.passTip = true;
        director.on(LanguageEvent.CHANGE, this.showLevel, this);
        
        AppGame.topUI.addBackFunc(() => {
            this.onBackBtn();
            AppGame.topUI.showMain();
        });
        
        AppGame.topUI.show(BTN_BACK | VALUE_COIN);
        MgrPass.Instance.checkResetData();

        const passCfgId = MgrPass.Instance.getPassCfgId();
        this.datas = PassCfg.Instance.getPassList(passCfgId);
        this.setDataSet(this.datas);
        this.list!.setAdapter(this);

        const passAwaitData = MgrPass.Instance.getPassAwaitData();
        if (passAwaitData) {
            this.list!.scrollToPage(passAwaitData.level + 0.7, 1, 0.5);
        }

        this.showRepeatLabel();
        this.showProgress();
        this.showTime();
        this.schedule(this.showTime, 0.5);
        this.showLevel();
    }

    onDisable() {
        director.targetOff(this);
        this.unschedule(this.showTime);
    }

    private showRepeatLabel() {
        const weekText = Language.Instance.getLangByID('week');
        const repeatId = MgrPass.Instance.getRepeatId();
        this.weekLabel!.string = weekText.replace('%value', repeatId.toString());
    }

    private showProgress() {
        const isCompleteAll = MgrPass.Instance.checkCompleteAll();
        this.passProgress!.node.parent!.active = !isCompleteAll;
        
        const tipsKey = isCompleteAll ? 'pass_complete' : 'pass_level';
        this.passTips!.string = Language.Instance.getLangByID(tipsKey);

        if (!isCompleteAll) {
            const passLevel = MgrPass.Instance.data.passLevel;
            let targetData: any = null;
            
            for (let i = 0; i < this.datas!.length; i++) {
                const data = this.datas![i];
                targetData = data;
                if (passLevel < data.totalLv) {
                    break;
                }
            }

            const currentProgress = passLevel - (targetData.totalLv - targetData.stage);
            this.progressLabel!.string = `${currentProgress} / ${targetData.stage}`;
            this.passProgress!.progress = currentProgress / targetData.stage;
            this.passLabel!.string = targetData.level.toString();
        }
    }

    private showTime() {
        const timeText = Language.Instance.getLangByID('Pass_Time');
        const remainTime = MgrPass.Instance.getRemainTime();
        const timeStr = Utils.timeConvertToHHMM(remainTime);
        
        this.timeLabel!.string = timeText + timeStr;

        if (remainTime <= 0) {
            this.unschedule(this.showTime);
            
            const autoReward = MgrPass.Instance.getAutoReward(true);
            if (lodash.keys(autoReward).length > 0) {
                MgrUi.Instance.openViewAsync(UIPrefabs.CommonRewardView, {
                    priority: 2,
                    data: {
                        rewardData: autoReward,
                        sourceType: 'PassReward',
                        title: Language.Instance.getLangByID('pass_title')
                    }
                });
            }

            MgrPass.Instance.resetPassData(Tools.GetNowMoment().valueOf());
            this.onBackBtn();
            AppGame.topUI.backToUpper();
        }
    }

    updateView(node: Node, index: number, data: any) {
        node.getComponent(passItem)!.show(data, this.datas![this.datas!.length - 1]);
    }

    private onBackBtn() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private onStartBtn() {
        AppGame.topUI.clearBackFunc();
        MgrUi.Instance.closeAll();
        MgrGame.Instance.enterLevel();
        NativeBridge.Instance.showInterstitialIfCooldown({
            OpenUi: 'Pass'
        });
    }

    private showLevel() {
        const currentLevel = MgrGame.Instance.gameData.curLv;
        this.lvLabel!.string = Language.Instance.getLangByID('Language1').replace('{0}', currentLevel.toString());
    }

    setDataSet(datas: any[]): void {
        this.datas = datas;
    }

    getCount(): number {
        return this.datas ? this.datas.length : 0;
    }

    getItem(index: number): any {
        return this.datas ? this.datas[index] : null;
    }
}