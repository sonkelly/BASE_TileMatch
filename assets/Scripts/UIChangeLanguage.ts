import { _decorator, Component, Button, Node } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {Language} from './Language';
import {ListViewAdapter} from './ListViewAdapter';
import { config } from './Config';
import {ListView} from './ListView';
import { LanguageItem } from './LanguageItem';

const { ccclass, property } = _decorator;

@ccclass('UIChangeLanguage')
export class UIChangeLanguage extends ListViewAdapter {
    @property(ListView)
    list: ListView | null = null;

    @property(Button)
    confirmBtn: Button | null = null;

    @property(Button)
    closeBtn: Button | null = null;

    private pickLanguage: any = null;

    onLoad() {
        this.closeBtn?.node.on('click', this.onClose, this);
        this.confirmBtn?.node.on('click', this.onConfirm, this);
    }

    onEnable() {
        this.pickLanguage = Language.Instance.current;
        const languages = Language.Instance.languages;
        
        this.setDataSet(languages);
        this.list?.setAdapter(this);

        const index = languages.indexOf(this.pickLanguage);
        if (index >= 0) {
            this.list?.scrollToPage(index, 1, 0.5);
        }
    }

    updateView(item: Node, index: number, data: any) {
        const languageItem = item.getComponent(LanguageItem);
        if (languageItem) {
            languageItem.delegate = this;
            languageItem.showItem(data, this.pickLanguage);
        }
    }

    onClose() {
        this.node.getComponent(ViewAnimCtrl)?.onClose();
    }

    selectLanguageEvent(language: any) {
        this.pickLanguage = language;
        this.list?.notifyUpdate();
    }

    onConfirm() {
        if (Language.Instance.current !== this.pickLanguage) {
            Language.Instance.setLanguage(this.pickLanguage, () => {
                config.saveLocalLanguage(this.pickLanguage);
                this.onClose();
            });
        } else {
            this.onClose();
        }
    }
}