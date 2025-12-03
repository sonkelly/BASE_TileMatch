import { _decorator, Component, Button, Label } from 'cc';
import {Language} from './Language';
import { StarEagueUpRange, StarEagueStillRange, StarEagueDownRange } from './MgrStar';
const { ccclass, property } = _decorator;

@ccclass('StarEagueHelpView')
export default class StarEagueHelpView extends Component {
    @property(Button)
    closeBtn: Button | null = null;

    @property(Label)
    tipLabel1: Label | null = null;

    @property(Label)
    tipLabel2: Label | null = null;

    @property(Label)
    tipLabel3: Label | null = null;

    onEnable() {
        const up0 = StarEagueUpRange[0];
        const up1 = StarEagueUpRange[1];
        const still0 = StarEagueStillRange[0];
        const still1 = StarEagueStillRange[1];
        const down0 = StarEagueDownRange[0];
        const down1 = StarEagueDownRange[1];

        if (this.tipLabel1) {
            this.tipLabel1.string = Language.Instance.getLangByID('star_rank1_desc')
                .replace('{0}', up0.toString())
                .replace('{1}', up1.toString());
        }
        if (this.tipLabel2) {
            this.tipLabel2.string = Language.Instance.getLangByID('star_rank3_desc')
                .replace('{0}', still0.toString())
                .replace('{1}', still1.toString());
        }
        if (this.tipLabel3) {
            this.tipLabel3.string = Language.Instance.getLangByID('star_rank2_desc')
                .replace('{0}', down0.toString())
                .replace('{1}', down1.toString());
        }
    }

    start() {
        if (this.closeBtn && this.closeBtn.node) {
            this.closeBtn.node.on('click', this._onClickClose, this);
        }
    }

    _onClickClose() {
        this.node.emit('Close');
    }
}