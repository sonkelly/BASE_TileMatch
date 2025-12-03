import { _decorator, CCInteger, CCFloat, Vec3, Node, Label, Tween, tween, easing, Component, cclegacy } from 'cc';
import {each} from 'lodash-es';
const { ccclass, property } = _decorator;

@ccclass('Lattice')
class Lattice {
    @property(CCInteger)
    multiple: number = 0;

    @property(CCFloat)
    leftBoundary: number = 0;

    @property(CCFloat)
    rightBoundary: number = 0;
}

@ccclass('Limit')
class Limit {
    @property(Vec3)
    min: Vec3 | null = null;

    @property(Vec3)
    max: Vec3 | null = null;
}

@ccclass('AdsMultiplex')
export class AdsMultiplex extends Component {
    @property(Node)
    arrow: Node | null = null;

    @property(Limit)
    limit: Limit = new Limit();

    @property([Lattice])
    lattices: Lattice[] = [];

    @property([Label])
    latticeLabel: Label[] = [];

    private _multiplexList: any[] = [];

    onEnable() {
        if (this.arrow && this.limit.min) {
            this.arrow.setPosition(this.limit.min);
        }
    }

    onDisable() {
        this.stopMultipe();
    }

    initMultipeList(list: any[]) {
        this._multiplexList = list;
        this.showLatticeLabel();
        this.rewriteLatticeValue();
    }

    showLatticeLabel() {
        each(this._multiplexList, (value: any, index: number) => {
            if (this.latticeLabel[index]) {
                this.latticeLabel[index].string = 'x' + value;
            }
        });
    }

    rewriteLatticeValue() {
        each(this._multiplexList, (value: any, index: number) => {
            if (this.lattices[index]) {
                this.lattices[index].multiple = value;
            }
        });
    }

    getMultipe(): number | undefined {
        if (!this.arrow) return undefined;
        
        const arrowX = this.arrow.getPosition().x;
        for (const lattice of this.lattices) {
            if (arrowX >= lattice.leftBoundary && arrowX <= lattice.rightBoundary) {
                return lattice.multiple;
            }
        }
        return undefined;
    }

    stopMultipe() {
        if (this.arrow) {
            Tween.stopAllByTarget(this.arrow);
        }
    }

    onMultipeMove() {
        if (!this.arrow || !this.limit.min || !this.limit.max) return;

        Tween.stopAllByTarget(this.arrow);
        this.arrow.setPosition(this.limit.min);
        
        tween(this.arrow)
            .to(2, { position: this.limit.max }, { easing: easing.quadInOut })
            .to(2, { position: this.limit.min }, { easing: easing.quadInOut })
            .union()
            .repeatForever()
            .start();
    }
}