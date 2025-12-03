import { _decorator, Component, Node } from 'cc';
const { ccclass, menu } = _decorator;

@ccclass('ListViewAdapter')
@menu('ListView/ListViewAdapter')
export class ListViewAdapter extends Component {
    public dataSet: any[] = [];

    public setDataSet(dataSet: any[] | null | undefined) {
        this.dataSet = dataSet || [];
    }

    public getCount(): number {
        return this.dataSet ? this.dataSet.length : 0;
    }

    public getItem(index: number): any {
        return this.dataSet[index];
    }

    public _getView(node: Node, index: number): Node {
        this.updateView(node, index, this.dataSet[index]);
        return node;
    }

    // Override this in subclasses to populate/update the node view
    protected updateView(node: Node, index: number, data: any): void {
        // no-op by default
    }
}