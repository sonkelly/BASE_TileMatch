import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LanguageData')
export class LanguageData extends Component {
    public static current: string = '';
    public static data: Record<string, string> = {};

    public static getLangByID(id: string): string {
        return LanguageData.data[id] || id;
    }
}