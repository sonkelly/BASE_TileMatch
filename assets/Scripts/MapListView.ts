import { _decorator, Component, Label, CCObject, log } from 'cc';
import { ListView } from './ListView';
import { ListViewAdapter } from './ListViewAdapter';
import { AppGame } from './AppGame';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { Language } from './Language';
import { MapListItem } from './MapListItem';
import { MgrGame } from './MgrGame';
import { MgrUi } from './MgrUi';
import { NativeBridge } from './NativeBridge';

const { ccclass, property } = _decorator;

@ccclass('MapListView')
export class MapListView extends ListViewAdapter {
    @property(ListView)
    listView: ListView | null = null;

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    levelsLabel: Label | null = null;

    private currConfig: any = null;
    private _buildQuery: MapListItem[] = [];

    public reuse(config: any): void {
        this.currConfig = config;
    }

    protected onEnable(): void {
        const self = this;
        
        AppGame.topUI.addBackFunc(() => {
            self.node.emit(VIEW_ANIM_EVENT.Close);
        });
        
        AppGame.topUI.show();
        
        if (this.nameLabel) {
            this.nameLabel.string = Language.Instance.getLangByID(this.currConfig.name);
        }
        
        if (this.levelsLabel) {
            this.levelsLabel.string = Language.Instance.getLangByID('Language1')
                .replace('{0}', this.currConfig.start + '-' + this.currConfig.end);
        }

        const dataSet: number[] = [];
        for (let i = this.currConfig.start; i <= this.currConfig.end; i++) {
            dataSet.push(i);
        }
        
        this.setDataSet(dataSet);
        
        if (this.listView) {
            this.listView.scrollToPage(0);
            this.listView.setAdapter(this);
        }
    }

    protected onDisable(): void {
        this._buildQuery.length = 0;
    }

    public updateView(item: any, index: number, data: any): void {
        const mapItem = item.getComponent(MapListItem);
        if (mapItem) {
            mapItem.delegate = this;
            mapItem.setLevel(data);
            mapItem.playEnter();
            this._buildQuery.push(mapItem);
        }
    }

    public selectLevelEvent(level: number): void {
        if (level <= MgrGame.Instance.gameData.maxLv) {
            AppGame.topUI.clearBackFunc();
            NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'ChooseLevel' });
            MgrUi.Instance.closeAll();
            MgrGame.Instance.gameData.curLv = level;
            MgrGame.Instance.enterLevel();
        }
    }

    protected lateUpdate(dt: number): void {
        if (this._buildQuery.length > 0) {
            const item = this._buildQuery.shift();
            if (item && item.node.active) {
                item.build();
            }
        }
    }
}