import { _decorator, Component, Button, Label, director, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { UIPrefabs } from './Prefabs';
import {Language} from './Language';
import { MgrStar } from './MgrStar';
import {MgrUi} from './MgrUi';
import {Utils} from './Utils';
import { TopUIItem } from './TopUIItem';

const { ccclass, property } = _decorator;

@ccclass('StarEagueMenu')
export class StarEagueMenu extends Component {
    @property(Button)
    starEagueBtn: Button | null = null;

    @property(Label)
    cdLabel: Label | null = null;

    @property(Label)
    rankLabel: Label | null = null;

    @property(TopUIItem)
    btnStar: TopUIItem | null = null;

    private canClick: boolean = true;
    private _dayHourStr: string = '';

    onLoad() {
        this.starEagueBtn?.node.on('click', this._clickSkyIslandBtn, this);
        this._dayHourStr = Language.Instance.getLangByID('Language371');
    }

    onEnable() {
        this.canClick = true;
        director.on(GlobalEvent.StarEagueStateChange, this._onStarEagueChange, this);
        director.on(GlobalEvent.StarEagueTimeChange, this._onStarEagueTimeChange, this);
        director.on(GlobalEvent.StarEagueRankRefresh, this._onStarEagleStarRefresh, this);
        director.on(GlobalEvent.StarEagueRankChange, this._onStarEagleStarRefresh, this);
        this._onStarEagueChange();
        this._onStarEagueTimeChange();
        this._onStarEagleStarRefresh();
    }

    onDisable() {
        director.targetOff(this);
    }

    private _onStarEagueChange() {
        if (this.rankLabel) {
            this.rankLabel.node.active = MgrStar.Instance.showMenuRank();
        }
        if (!MgrStar.Instance.showMenu()) {
            if (this.btnStar) {
                this.btnStar.isVisible = false;
                this.btnStar.hide();
            }
        }
    }

    private _onStarEagueTimeChange() {
        const remainTime = MgrStar.Instance.getRemainTime();
        if (this.cdLabel) {
            this.cdLabel.string = remainTime >= 0 ? Utils.timeConvertToHHMM(remainTime) : '';
        }
    }

    private _onStarEagleStarRefresh() {
        if (this.rankLabel) {
            this.rankLabel.node.active = MgrStar.Instance.showMenuRank();
            const rankData = MgrStar.Instance.getRankData();
            this.rankLabel.string = rankData.selfData.rank.toString();
        }
    }

    private _clickSkyIslandBtn() {
        if (!this.canClick) return;

        if (MgrStar.Instance.checkJoinCurPeriod()) {
            MgrStar.Instance.resetPrevStar();
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueView, {
                root: MgrUi.root(1)
            });
        } else {
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueStartView);
        }

        this.canClick = false;
        this.scheduleOnce(() => {
            this.canClick = true;
        }, 0.5);
    }
}