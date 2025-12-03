import { _decorator, Component, Label, director } from 'cc';
import {ListViewAdapter} from './ListViewAdapter';
import {ListView} from './ListView';
import { GoldTournamentV2SelfPanel } from './GoldTournamentV2SelfPanel';
import { GlobalEvent } from './Events';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { Utils } from './Utils';
import { GoldTournamentV2ViewItem } from './GoldTournamentV2ViewItem';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentV2RankPanel')
export class GoldTournamentV2RankPanel extends ListViewAdapter {
    @property(Label)
    remainTimeLabel: Label | null = null;

    @property(ListView)
    listView: ListView | null = null;

    @property(GoldTournamentV2SelfPanel)
    viewSelfPanel: GoldTournamentV2SelfPanel | null = null;

    onEnable(): void {
        director.on(GlobalEvent.refreshGoldTourTimeStampV2, this._goldTourRefreshRemainTime, this);
        director.on(GlobalEvent.refreshGoldTourRankAiDataV2, this._refreshRankList, this);
        this._goldTourRefreshRemainTime();
        this._refreshRankList();
    }

    onDisable(): void {
        director.targetOff(this);
    }

    private _refreshRankList(): void {
        const rankData = MgrGoldTournamentV2.Instance.getGoldTourRankIndexData();
        if (rankData && rankData.rankData) {
            this.setDataSet(rankData.rankData);
            this.listView!.setAdapter(this);
            this.listView!.getScrollView().stopAutoScroll();
            this.listView!.getScrollView().scrollToTop(0);
            this.viewSelfPanel!.refreshSelfRank(rankData.selfData);
        } else {
            console.error('no datas in tourRankList.');
        }
    }

    private _goldTourRefreshRemainTime(): void {
        const timeStr = Utils.timeConvertToHHMM(MgrGoldTournamentV2.Instance.goldTourFinishTimeStampDiff);
        this.remainTimeLabel!.string = timeStr;
    }

    updateView(item: any, index: number, data: any): void {
        const viewItem = item.getComponent(GoldTournamentV2ViewItem);
        if (viewItem) {
            viewItem.refreshRankData(data);
        }
    }
}