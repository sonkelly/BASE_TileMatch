import { _decorator, Component, Node, Button, Label } from 'cc';
import { Language } from './Language';

const { ccclass, property } = _decorator;

@ccclass('LanguageItem')
export class LanguageItem extends Component {
    @property(Button)
    nodeBtn: Button | null = null;

    @property(Node)
    chooseNode: Node | null = null;

    @property(Label)
    lgeLabel: Label | null = null;

    private lgeStr: string | null = null;
    private delegate: any = null;

    protected onLoad(): void {
        if (this.nodeBtn) {
            this.nodeBtn.node.on('click', this.onLanguageChange, this);
        }
    }

    public showItem(lgeStr: string, currentLang: string): void {
        this.lgeStr = lgeStr;
        if (this.lgeLabel) {
            this.lgeLabel.string = Language.Instance.getLangByID('language_' + lgeStr);
        }
        if (this.chooseNode) {
            this.chooseNode.active = currentLang === lgeStr;
        }
    }

    private onLanguageChange(): void {
        if (this.delegate && this.lgeStr) {
            this.delegate.selectLanguageEvent(this.lgeStr);
        }
    }

    public setDelegate(delegate: any): void {
        this.delegate = delegate;
    }
}