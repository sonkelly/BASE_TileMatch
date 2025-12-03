import { _decorator, CCString, Label, RichText, warn, Component, cclegacy } from 'cc';
import { LanguageData } from './LanguageData';

const { ccclass, property, menu } = _decorator;

class LangLabelParamsItem {
    @property
    key: string = '';

    @property
    value: string = '';
}

@ccclass('LanguageLabel')
@menu('language/LanguageLabel')
export class LanguageLabel extends Component {
    @property({
        type: LangLabelParamsItem,
        displayName: 'params'
    })
    private _params: LangLabelParamsItem[] = [];

    @property({
        serializable: true
    })
    private _dataID: string = '';

    @property({
        type: CCString,
        serializable: true
    })
    get dataID(): string {
        return this._dataID || '';
    }
    set dataID(value: string) {
        this._dataID = value;
        this._needUpdate = true;
    }

    get params(): LangLabelParamsItem[] {
        return this._params || [];
    }
    set params(value: LangLabelParamsItem[]) {
        this._params = value;
        this._needUpdate = true;
    }

    get string(): string {
        let result = LanguageData.getLangByID(this._dataID);
        if (result && this._params.length > 0) {
            this._params.forEach(param => {
                result = result.replace(`%{${param.key}}`, param.value);
            });
        }
        if (!result) {
            warn('[LanguageLabel] 未找到语言标识，使用dataID替换');
            result = this._dataID;
        }
        return result;
    }

    get label(): Label | null {
        return this.getComponent(Label);
    }

    private initFontSize: number = 0;
    private _needUpdate: boolean = true;

    language(): void {
        this._needUpdate = true;
    }

    onLoad(): void {
        const label = this.getComponent(Label);
        const richText = this.getComponent(RichText);
        
        if (label || richText) {
            if (richText) {
                this.initFontSize = richText.fontSize;
            }
            if (label) {
                this.initFontSize = label.fontSize;
            }
        }
    }

    onEnable(): void {
        this._needUpdate = true;
    }

    getLabelFont(lang: string): string {
        switch (lang) {
            case 'zh':
            case 'tr':
                return 'SimHei';
        }
        return 'Helvetica';
    }

    setVars(key: string, value: string): void {
        let found = false;
        for (let i = 0; i < this._params.length; i++) {
            const param = this._params[i];
            if (param.key === key) {
                param.value = value;
                found = true;
            }
        }
        if (!found) {
            const newParam = new LangLabelParamsItem();
            newParam.key = key;
            newParam.value = value;
            this._params.push(newParam);
        }
        this._needUpdate = true;
    }

    update(): void {
        if (this._needUpdate) {
            this._needUpdate = false;
            this.updateLabel();
        }
    }

    updateLabel(): void {
        if (!this._dataID) {
            return;
        }

        const label = this.getComponent(Label) || this.getComponent(RichText);
        if (!label) {
            warn('[LanguageLabel], 该节点没有cc.Label || cc.RichText组件');
            return;
        }

        label.string = this.string;
    }
}