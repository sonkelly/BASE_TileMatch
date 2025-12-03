import { _decorator, Component, NodePool, Prefab, instantiate, js, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIPool')
export class UIPool extends Component {
    @property(Prefab)
    public prefab: Prefab | null = null;

    private _pool: NodePool = new NodePool();
    private _nodes: Node[] = [];

    public clear(): void {
        this._nodes.forEach((node: Node) => {
            this._pool.put(node);
        });
        this._nodes.length = 0;
    }

    public getNodes(): Node[] {
        return this._nodes;
    }

    public get(): Node {
        let node: Node = null;
        if (this._pool.size() > 0) {
            node = this._pool.get();
        } else {
            node = instantiate(this.prefab);
        }
        this._nodes.push(node);
        return node;
    }

    public put(target: Node | Component): void {
        let node: Node;
        if (target instanceof Component) {
            node = target.node;
        } else {
            node = target;
        }

        const index = this._nodes.indexOf(node);
        if (index >= 0) {
            js.array.fastRemoveAt(this._nodes, index);
        }
        this._pool.put(node);
    }

    protected onDestroy(): void {
        this._pool.clear();
        this._nodes.length = 0;
    }
}