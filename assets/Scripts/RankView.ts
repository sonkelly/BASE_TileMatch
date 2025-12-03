import { _decorator, Button, Node, ScrollView, director } from 'cc';
import { GlobalEvent } from './Events';
import { UIPrefabs } from './Prefabs';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { Language } from './Language';
import { ListView } from './ListView';
import { ListViewAdapter } from './ListViewAdapter';
import { RankType } from './RankData';
import { MgrRank } from './MgrRank';
import { MgrUi } from './MgrUi';
import { MgrWeakGuide } from './MgrWeakGuide';
import { AppGame } from './AppGame';
import { GuidePos } from './WeakGuide';
import { BTN_BACK } from './TopUIView';
import { RankViewInfoPanel } from './RankViewInfoPanel';
import { RankViewItem } from './RankViewItem';
import { RankViewSelfPanel } from './RankViewSelfPanel';
import { SocialManager, SocialMgr } from './SocialManager';
import { InviteReportPoint, InviteType } from './ReportEventEnum';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';

const { ccclass, property } = _decorator;

@ccclass('RankView')
export class RankView extends ListViewAdapter {
    @property(Button)
    btnYearTab: Button = null!;

    @property(Button)
    btnMonthTab: Button = null!;

    @property(Button)
    btnFriendTab: Button = null!;

    @property(Node)
    nodeYearTab: Node = null!;

    @property(Node)
    nodeMonthTab: Node = null!;

    @property(Node)
    nodeFriendTab: Node = null!;

    @property(ListView)
    listView: ListView = null!;

    @property(RankViewInfoPanel)
    viewInfoPanel: RankViewInfoPanel = null!;

    @property(RankViewSelfPanel)
    viewSelfPanel: RankViewSelfPanel = null!;

    @property(ScrollView)
    scrollView: ScrollView = null!;

    @property(Button)
    inviteBtn: Button = null!;

    private _canRunActIn: boolean = false;

    private closeRankEvent() {
        AppGame.topUI.clearBackFunc();
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private _inviteClickHandle() {
        SocialManager.instance().shareImg();
        this.reportInviteClick('Rank');
        SocialMgr.showSocialList(async () => {}, null, InviteReportPoint.Rank);
    }

    onLoad() {
        this.btnYearTab.node.on('click', this._chooseYearTab, this);
        this.btnMonthTab.node.on('click', this._chooseMonthTab, this);
        this.btnFriendTab.node.on('click', this._chooseFriendTab, this);
        this.inviteBtn.node.on('click', this._inviteClickHandle, this);
        this.scrollView.node.on('scroll-began', () => {
            this._canRunActIn = true;
        });
    }

    onEnable() {
        AppGame.Ins.checkNetwork();
        director.on(GlobalEvent.refreshRankAiData, this._refreshRankData, this);
        director.on(GlobalEvent.reInitMonthRankAiData, this._reInitMonthAiData, this);
        director.on(GlobalEvent.refreshAvatar, this._refreshPlayerInfo, this);
        director.on(GlobalEvent.refreshNick, this._refreshPlayerInfo, this);
        director.on(GlobalEvent.closeRankView, this.closeRankEvent, this);

        AppGame.topUI.addBackFunc(() => {
            this._onBackBtn();
            AppGame.topUI.showMain();
        });

        AppGame.topUI.show(BTN_BACK);
        this.scheduleOnce(() => {
            this.guide();
        }, 0.5);
        this._canRunActIn = true;
        this._refreshRank();
    }

    onDisable() {
        director.targetOff(this);
    }

    private _onBackBtn() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private _refreshPlayerInfo() {
        this._canRunActIn = false;
        this._refreshRank();
    }

    private _refreshRankData(rankType: RankType) {
        if (rankType === MgrRank.Instance.rankType) {
            this._refreshRankList();
            this._canRunActIn = false;
        }
    }

    private _reInitMonthAiData() {
        if (MgrRank.Instance.rankType === RankType.Month) {
            this._refreshRankList();
            this._canRunActIn = false;
        }
    }

    private _chooseYearTab() {
        MgrRank.Instance.rankType = RankType.Year;
        this._canRunActIn = true;
        this._refreshRank();
    }

    private _chooseMonthTab() {
        MgrRank.Instance.rankType = RankType.Month;
        this._canRunActIn = true;
        this._refreshRank();
    }

    private _chooseFriendTab() {
        MgrRank.Instance.rankType = RankType.Friend;
        this._canRunActIn = true;
        this._refreshRank();
    }

    private _refreshRank() {
        this._refreshRankTypeTab();
        this._refreshRankList(true);
        this.viewInfoPanel.refreshWisdom();
        this.viewInfoPanel.refreshTimeShow();
    }

    private _refreshRankTypeTab() {
        this.btnYearTab.node.active = MgrRank.Instance.rankType !== RankType.Year;
        this.nodeYearTab.active = MgrRank.Instance.rankType === RankType.Year;
        this.btnFriendTab.node.active = MgrRank.Instance.rankType !== RankType.Friend;
        this.nodeFriendTab.active = MgrRank.Instance.rankType === RankType.Friend;
        this.btnMonthTab.node.active = MgrRank.Instance.rankType !== RankType.Month;
        this.nodeMonthTab.active = MgrRank.Instance.rankType === RankType.Month;
    }

    private async _refreshRankList(scrollToTop: boolean = false) {
        this.setDataSet([]);
        this.listView.setAdapter(this);

        const rankData = await MgrRank.Instance.getRankIndexData(MgrRank.Instance.rankType);
        this.setDataSet(rankData.rankData);
        this.listView.setAdapter(this);

        if (scrollToTop) {
            this.listView.getScrollView()!.stopAutoScroll();
            this.listView.getScrollView()!.scrollToTop(0);
        }

        this.viewSelfPanel.refreshSelfRank(rankData.selfData);
    }

    updateView(item: Node, index: number, data: any) {
        item.getComponent(RankViewItem)!.refreshRankData(data, index);
        if (this._canRunActIn) {
            item.getComponent(RankViewItem)!.playEnter();
        }
    }

    private guide() {
        if (!MgrRank.Instance.rankData.tip) {
            MgrRank.Instance.rankData.tip = true;
            this.viewSelfPanel.btnHead.interactable = false;
            this.viewSelfPanel.btnName.interactable = false;

            MgrWeakGuide.Instance.openWeakGuide({
                node: this.viewSelfPanel.node,
                click: () => {
                    MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailView, {
                        root: MgrUi.root(1),
                        data: UIPrefabs.RankView.url
                    });
                    MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailEditView, {
                        priority: 2
                    });
                },
                close: () => {
                    this.viewSelfPanel.btnHead.interactable = true;
                    this.viewSelfPanel.btnName.interactable = true;
                },
                pos: GuidePos.Top,
                lang: Language.Instance.getLangByID('edit_profile')
            });
        }
    }

    private reportInviteClick(inviteType: string) {
        const clickCount = MgrAnalytics.Instance.data.addInviteClickTime(InviteType.Long);
        AnalyticsManager.getInstance().reportInviteClick({
            Click_Num: clickCount,
            Invite_Type: inviteType
        });
    }
}