import { _decorator, Node } from 'cc';
import {ListView} from './ListView';
import {ListViewAdapter} from './ListViewAdapter';
import {AppGame} from './AppGame';
import {ViewAnimCtrl} from './ViewAnimCtrl';
import { BTN_BACK } from './TopUIView';
import SkinCfg from './SkinCfg';
import {GameSkinItem} from './GameSkinItem';

const { ccclass, property } = _decorator;

@ccclass('GameSkin')
export default class GameSkin extends ListViewAdapter {
    @property(ListView)
    public listView: ListView | null = null;

    onEnable(): void {
        AppGame.topUI.addBackFunc(() => {
            (this.node.getComponent(ViewAnimCtrl) as ViewAnimCtrl).onClose();
            AppGame.topUI.showMain();
        });

        AppGame.topUI.show(BTN_BACK);

        // convert skin config map to array and set data
        const all = SkinCfg.Instance.getAll();
        const values = Object.values(all);
        this.setDataSet(values);

        if (this.listView) {
            this.listView.setAdapter(this);
            const sv = this.listView.getScrollView();
            if (sv && typeof sv.scrollToTop === 'function') {
                sv.scrollToTop();
            }
        }
    }

    // node: item node, index: item index, data: item data (skin cfg)
    updateView(node: Node, index: number, data: any): void {
        const comp = node.getComponent(GameSkinItem) as unknown as GameSkinItem;
        if (comp && typeof comp.setCfg === 'function') {
            comp.setCfg(data);
        }
    }
}