import { _decorator, Node, Scene, Component, NodePool, sys, view, cclegacy } from 'cc';

declare global {
    interface Node {
        getComponentInParent<T extends Component>(type: new () => T): T | null;
    }

    interface Component {
        getComponentInParent<T extends Component>(type: new () => T): T | null;
    }

    interface NodePool {
        get(...args: any[]): Node | null;
    }
}

Node.prototype.getComponentInParent = function <T extends Component>(type: new () => T): T | null {
    const comp = this.getComponent(type);
    if (comp instanceof type) {
        return comp;
    }
    const parent = this.getParent();
    return parent && !(parent instanceof Scene) ? parent.getComponentInParent(type) : null;
};

Component.prototype.getComponentInParent = function <T extends Component>(type: new () => T): T | null {
    const comp = this.getComponent(type);
    if (comp instanceof type) {
        return comp;
    }
    const parentNode = this.node.getParent();
    return parentNode ? parentNode.getComponentInParent(type) : null;
};

NodePool.prototype.get = function (...args: any[]): Node | null {
    const lastIndex = this._pool.length - 1;
    if (lastIndex < 0) {
        return null;
    }
    
    const node = this._pool[lastIndex];
    this._pool.length = lastIndex;
    
    const handlerComp = this.poolHandlerComp ? node.getComponent(this.poolHandlerComp) : null;
    if (handlerComp && handlerComp.reuse) {
        handlerComp.reuse.apply(handlerComp, args);
    }
    
    return node;
};

const originalGetSafeAreaRect = sys.getSafeAreaRect;
sys.getSafeAreaRect = function (): Rect {
    const rect = originalGetSafeAreaRect.call(this);
    if (sys.isBrowser) {
        const visibleSize = view.getVisibleSize();
        if (rect.width > visibleSize.width) {
            rect.width = visibleSize.width;
            rect.x = 0;
        }
    }
    return rect;
};