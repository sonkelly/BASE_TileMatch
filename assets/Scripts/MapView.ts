import { _decorator, Component, Node } from 'cc';
import { AppGame } from './AppGame';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {ListView} from './ListView';
import {ListViewAdapter} from './ListViewAdapter';
import {LevelCfg} from './LevelCfg';
import { MapViewItem } from './MapViewItem';
import { BTN_BACK } from './TopUIView';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import {values} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MapView')
export class MapView extends ListViewAdapter {
    @property(ListView)
    listView: ListView | null = null;

    onEnable(): void {
        const appGame = AppGame.topUI;
        appGame.addBackFunc(() => {
            this.node.getComponent(ViewAnimCtrl)?.onClose();
            appGame.showMain();
        });
        appGame.show(BTN_BACK);

        const levelData = values(LevelCfg.Instance.getAll());
        this.setDataSet(levelData);
        this.listView?.setAdapter(this);
        this.listView?.getScrollView().scrollToTop(0);
    }

    updateView(item: Node, index: number, data: any): void {
        const mapViewItem = item.getComponent(MapViewItem);
        if (mapViewItem) {
            mapViewItem.setConfig(data);
            mapViewItem.delegate = this;
            mapViewItem.playEnter();
        }
    }

    selectItemEvent(data: any): void {
        MgrUi.Instance.openViewAsync(UIPrefabs.MapList, {
            priority: 1,
            data: data
        });
    }
}