import { _decorator, Label, director, Node } from 'cc';
import {ListViewAdapter} from './ListViewAdapter';
import {ListView} from './ListView';
import { GlobalEvent } from './Events';
import { MgrGoldTournament } from './MgrGoldTournament';
import {Utils} from './Utils';
import { GoldTournamentViewItem } from './GoldTournamentViewItem';
import { GoldTournamentSelfPanel } from './GoldTournamentSelfPanel';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentRankPanel')
export default class GoldTournamentRankPanel extends ListViewAdapter {
    @property(Label)
    public remainTimeLabel: Label | null = null;

    @property(ListView)
    public listView: ListView | null = null;

    @property(GoldTournamentSelfPanel)
    public viewSelfPanel: GoldTournamentSelfPanel | null = null;

    onEnable() {
        director.on(GlobalEvent.refreshGoldTourTimeStamp, this._goldTourRefreshRemainTime, this);
        director.on(GlobalEvent.refreshGoldTourRankAiData, this._refreshRankList, this);
        this._goldTourRefreshRemainTime();
        this._refreshRankList();
    }

    onDisable() {
        director.targetOff(this);
    }

    private _refreshRankList() {
        const data = MgrGoldTournament.Instance.getGoldTourRankIndexData();
        if (data && data.rankData) {
            this.setDataSet(data.rankData);
            this.listView?.setAdapter(this);
            const sv = this.listView?.getScrollView();
            sv?.stopAutoScroll();
            sv?.scrollToTop(0);
            this.viewSelfPanel?.refreshSelfRank(data.selfData);
        } else {
            console.error('no datas in tourRankList.');
        }
    }

    private _goldTourRefreshRemainTime() {
        const timeStr = Utils.timeConvertToHHMM(MgrGoldTournament.Instance.goldTourFinishTimeStampDiff);
        if (this.remainTimeLabel) {
            this.remainTimeLabel.string = timeStr;
        }
    }

    updateView(item: Node, index: number, data: any) {
        const comp = item.getComponent(GoldTournamentViewItem);
        comp?.refreshRankData(data);
    }
}