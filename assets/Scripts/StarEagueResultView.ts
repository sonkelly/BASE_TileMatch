import { _decorator, Component, Button, Label, Node } from 'cc';
import { UIPrefabs } from './Prefabs';
import StarLeagueCfg from './StarLeagueCfg';
import {Language} from './Language';
import { MgrStar, StarEagueRewardBox, StarEagueRewardItem, StarEagleStageLevel } from './MgrStar';
import {MgrUi} from './MgrUi';
import { StarEagueItem } from './StarEagueItem';
import { StarleagueStage } from './StarleagueStage';

const { ccclass, property } = _decorator;

@ccclass('StarEagueResultView')
export class StarEagueResultView extends Component {
    @property(Button)
    sureBtn: Button | null = null;

    @property(Label)
    sureLabel: Label | null = null;

    @property([StarEagueItem])
    topThreeItem: StarEagueItem[] = [];

    @property(StarEagueItem)
    selfItem: StarEagueItem | null = null;

    @property(StarleagueStage)
    starleagueStage: StarleagueStage | null = null;

    private _hideCall: (() => void) | null = null;
    private _rankShowDatas: any = null;

    onLoad() {
        this.sureBtn?.node.on('click', this._onSureBtn, this);
    }

    reuse(data: any) {
        if (data) {
            this._hideCall = data.hideCall;
        }
    }

    onEnable() {
        this._rankShowDatas = MgrStar.Instance.getRankData();
        this.selfItem?.refreshRankData(this._rankShowDatas.selfData);

        for (let i = 0; i < 3; i++) {
            this.topThreeItem[i]?.refreshRankData(this._rankShowDatas.rankData[i]);
        }

        this.sureLabel!.string = Language.Instance.getLangByID('ui_ok');
        this.starleagueStage?.init(MgrStar.Instance.starData.level);
    }

    private _onSureBtn() {
        const prevLevel = MgrStar.Instance.starData.level;
        MgrStar.Instance.settlePersiod(MgrStar.Instance.starData.period, this._rankShowDatas.selfData.rank);
        const curLevel = MgrStar.Instance.starData.level;

        if (this._rankShowDatas.selfData.rank <= 100) {
            const stageGroup = Math.ceil(prevLevel / 10);
            const stageCfg = StarLeagueCfg.Instance.get(stageGroup);
            const rewards = this._rankShowDatas.selfData.rank <= 3 
                ? stageCfg[`rewards${this._rankShowDatas.selfData.rank}`] 
                : stageCfg.rewards4;

            MgrUi.Instance.openViewAsync(UIPrefabs.StarEagueRewardView, {
                data: {
                    reward: rewards,
                    prevLevel: prevLevel,
                    curLevel: curLevel,
                    hideCall: () => {
                        this._hideCall?.();
                    }
                }
            });
        } else {
            MgrUi.Instance.openViewAsync(UIPrefabs.StarEagueStageView, {
                data: {
                    prevLevel: prevLevel,
                    curLevel: curLevel,
                    hideCall: () => {
                        this._hideCall?.();
                    }
                }
            });
        }

        this.node.emit('Close');
    }
}