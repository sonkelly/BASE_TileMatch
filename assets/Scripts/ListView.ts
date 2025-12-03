import { _decorator, Component, Node, Vec2, CCInteger, ScrollView, UITransform, error, Rect, warn, cclegacy } from 'cc';
import { UIPool } from './UIPool';
const { ccclass, property, menu } = _decorator;

@ccclass('ListView')
@menu('ListView/ListView')
export class ListView extends UIPool {
    @property({
        tooltip: '元素间距'
    })
    spacing: Vec2 = new Vec2();

    @property({
        tooltip: '四周距离'
    })
    margin: Rect = new Rect();

    @property({
        type: CCInteger,
        tooltip: '比可见元素多缓存2个, 缓存越多,快速滑动越流畅,但同时初始化越慢.'
    })
    spawnCount: number = 2;

    @property({
        type: CCInteger,
        tooltip: '横向布局的item 数量. 默认为1,即每行一个元素'
    })
    column: number = 1;

    @property(ScrollView)
    scrollView: ScrollView | null = null;

    private content: UITransform | null = null;
    private adapter: any = null;
    private _filledIds: { [key: number]: Node | null } = {};
    private horizontal: boolean = true;
    private _itemHeight: number = 1;
    private _itemWidth: number = 1;
    private _temp_node: Node | null = null;
    private _itemsVisible: number = 1;
    private dataChanged: boolean = true;
    private _isInited: boolean = false;
    private visibleRange: number[] = [-1, -1];
    private _needSort: boolean = true;
    private scrollTopNotifyed: boolean = true;
    private scrollBottomNotifyed: boolean = true;
    private pullDownCallback: Function | null = null;
    private pullUpCallback: Function | null = null;
    private _tempSpawnCount: number = 0;

    get itemHeight(): number {
        return this._itemHeight;
    }

    get itemWidth(): number {
        return this._itemWidth;
    }

    get visibleCount(): number {
        return this._itemsVisible;
    }

    get needSort(): boolean {
        return this._needSort;
    }

    set needSort(value: boolean) {
        this._needSort = value;
    }

    getTopIndex(): number {
        return this.visibleRange[0];
    }

    getBottomIndex(): number {
        return this.visibleRange[1];
    }

    onLoad() {
        this.init();
        if (this.scrollView) {
            this.scrollView.node.on('scroll-began', () => {
                this.scrollTopNotifyed = true;
                this.scrollBottomNotifyed = true;
            });
        }
    }

    onDestroy() {
        this.clear();
        this._filledIds = {};
    }

    async setAdapter(adapter: any) {
        if (this.adapter !== adapter) {
            this.adapter = adapter;
            if (this.adapter != null) {
                if (this.prefab != null) {
                    this.visibleRange[0] = this.visibleRange[1] = -1;
                    this.notifyUpdate();
                } else {
                    error('Listview 未设置待显示的Item模板.');
                }
            } else {
                warn('adapter 为空.');
            }
        } else {
            this.notifyUpdate();
        }
    }

    getAdapter(): any {
        return this.adapter;
    }

    getScrollView(): ScrollView | null {
        return this.scrollView;
    }

    scrollToByIndex(index: number, timeInSecond?: number) {
        const offset = new Vec2();
        if (this.horizontal) {
            offset.set(index * this._itemWidth, 0);
        } else {
            offset.set(0, index * this.itemHeight - this.itemHeight);
        }
        this.scrollView?.scrollToOffset(offset, timeInSecond);
    }

    getMatchItem(predicate: (node: Node) => boolean): Node | null {
        let result = null;
        for (const key in this._filledIds) {
            if (Object.prototype.hasOwnProperty.call(this._filledIds, key)) {
                const node = this._filledIds[key];
                if (node && predicate(node)) {
                    result = node;
                    break;
                }
            }
        }
        return result;
    }

    getItems(): { [key: number]: Node | null } {
        return this._filledIds;
    }

    scrollToPage(page: number, pageSize?: number, timeInSecond?: number): boolean {
        if (!this.adapter || !this.scrollView) {
            return true;
        }

        if (this.horizontal) {
            let size = 0;
            const contentWidth = this.content!.width;
            const columnSize = this.getColumnWH();

            if (pageSize) {
                size = columnSize * pageSize;
            } else {
                const parentWidth = this.content!.node.parent!.getComponent(UITransform)!.width;
                size = Math.floor(parentWidth / columnSize) * columnSize;
            }

            const offset = new Vec2(size * page, 0);
            this.scrollView.scrollToOffset(offset, timeInSecond);
            return size * (page + 1) >= contentWidth;
        } else {
            const contentHeight = this.content!.height;
            const columnSize = this.getColumnWH();
            let size = 0;

            if (pageSize) {
                size = columnSize * pageSize;
            } else {
                const parentHeight = this.content!.node.parent!.getComponent(UITransform)!.height;
                size = Math.floor(parentHeight / columnSize) * columnSize;
            }

            const offset = new Vec2(0, size * page);
            this.scrollView.scrollToOffset(offset, timeInSecond);
            return size * (page + 1) >= contentHeight;
        }
    }

    getVisibleElements(): number {
        let count = 0;
        const parentTransform = this.content!.node.parent!.getComponent(UITransform)!;

        if (this.horizontal) {
            const width = parentTransform.width;
            count = Math.floor(width / this.getColumnWH());
        } else {
            const height = parentTransform.height;
            count = Math.floor(height / this.getColumnWH());
        }

        return count * this.column;
    }

    getColumnWH(): number {
        return this.horizontal ? this._itemWidth + this.spacing.x : this._itemHeight + this.spacing.y;
    }

    getColumnSize(): number {
        return this.horizontal ? this._itemWidth : this._itemHeight;
    }

    notifyUpdate(immediate: boolean = true) {
        if (this.adapter == null) return;
        
        if (!this._isOnLoadCalled) this.init();
        if (!this.scrollView || !this.content) return;

        const parentTransform = this.content.node.parent!.getComponent(UITransform)!;
        const rowCount = Math.ceil(this.adapter.getCount() / this.column);

        if (this.horizontal) {
            this.content.width = rowCount * (this._itemWidth + this.spacing.x) - this.spacing.x + this.margin.x + this.margin.width;
            this.content.width = Math.max(this.content.width, parentTransform.width);
        } else {
            this.content.height = rowCount * (this._itemHeight + this.spacing.y) - this.spacing.y + this.margin.y + this.margin.height;
            this.content.height = Math.max(this.content.height, parentTransform.height);
        }

        if (immediate) {
            const range = this.getVisibleRange();
            if (!this.checkNeedUpdate(range)) return;
            
            this.recycleDirty(range);
            this.updateView(range);
        } else {
            this._recycleAll();
            this.visibleRange[0] = this.visibleRange[1] = -1;
            this.dataChanged = false;
        }
    }

    pullDown(callback: Function, context: any) {
        this.pullDownCallback = callback.bind(context);
    }

    pullUp(callback: Function, context: any) {
        this.pullUpCallback = callback.bind(context);
    }

    lateUpdate() {
        const range = this.getVisibleRange();
        if (this.checkNeedUpdate(range)) {
            this.recycleDirty(range);
            this.updateView(range);
        }
    }

    private _layoutVertical(node: Node, index: number) {
        const transform = node.getComponent(UITransform)!;
        const columnIndex = index % (this.column || 1);
        const rowIndex = Math.floor(index / (this.column || 1));

        const x = this.column > 1 ? 
            this.margin.x + transform.width * transform.anchorX + (transform.width + this.spacing.x) * columnIndex - this.content!.width * this.content!.anchorX : 0;
        
        const y = -this.margin.y - transform.height * (transform.anchorY + rowIndex) - this.spacing.y * rowIndex;
        
        node.setPosition(x, y);
    }

    private _layoutHorizontal(node: Node, index: number) {
        const transform = node.getComponent(UITransform)!;
        const columnIndex = index % (this.column || 1);
        const rowIndex = Math.floor(index / (this.column || 1));

        const x = transform.width * (transform.anchorX + rowIndex) + this.spacing.x * rowIndex + this.margin.x;
        
        const y = this.column > 1 ? 
            -1 * (this.margin.y + transform.height * transform.anchorY + (transform.height + this.spacing.y) * columnIndex - this.content!.height * this.content!.anchorY) : 0;
        
        node.setPosition(x, y);
    }

    layoutView(node: Node, index: number) {
        if (this.horizontal) {
            this._layoutHorizontal(node, index);
        } else {
            this._layoutVertical(node, index);
        }
    }

    private _recycleAll() {
        for (const key in this._filledIds) {
            if (this._filledIds.hasOwnProperty(key)) {
                this.put(this._filledIds[key]!);
            }
        }
        this._filledIds = {};
    }

    recycleDirty(range: number[]) {
        if (!range || range.length < 2) return;

        // Recycle items before new range start
        for (let i = this.visibleRange[0]; i < range[0]; i++) {
            if (i >= 0 && this._filledIds[i]) {
                this.put(this._filledIds[i]!);
                this._filledIds[i] = null;
            }
        }

        // Recycle items after new range end
        for (let i = this.visibleRange[1] - 1; i >= range[1]; i--) {
            if (i >= 0 && this._filledIds[i]) {
                this.put(this._filledIds[i]!);
                this._filledIds[i] = null;
            }
        }

        this.visibleRange[0] = range[0];
        this.visibleRange[1] = range[1];
    }

    checkNeedUpdate(range: number[]): boolean {
        return range && this.visibleRange && 
               (this.visibleRange[0] !== range[0] || this.visibleRange[1] !== range[1]);
    }

    updateView(range: number[]) {
        for (let i = range[0]; i < range[1]; i++) {
            if (this.dataChanged || !this._filledIds[i]) {
                let node = this._filledIds[i];
                if (!node) {
                    node = this.get();
                    this.content!.node.addChild(node);
                }
                this.layoutView(node, i);
                this._filledIds[i] = this.adapter._getView(node, i);
            }
        }

        if (this.needSort) {
            this._tempSpawnCount = 0;
            for (const key in this._filledIds) {
                this._temp_node = this._filledIds[key];
                if (this._temp_node) {
                    this._temp_node.setSiblingIndex(this._tempSpawnCount);
                    this._tempSpawnCount++;
                }
            }
        }

        this.dataChanged = false;
    }

    getVisibleRange(): number[] {
        if (this.adapter == null) return [0, 0];

        const offset = this.scrollView!.getScrollOffset();
        let startIndex = 0;

        if (this.horizontal) {
            startIndex = Math.floor((-offset.x - this.margin.x) / (this._itemWidth + this.spacing.x));
        } else {
            startIndex = Math.floor((offset.y - this.margin.y) / (this._itemHeight + this.spacing.y));
        }

        if (startIndex < 0) {
            startIndex = 0;
            if (!this.scrollTopNotifyed) {
                this.notifyScrollToTop();
                this.scrollTopNotifyed = true;
                this.scrollBottomNotifyed = true;
            }
        }

        let endIndex = this.column * (startIndex + this._itemsVisible + this.spawnCount);

        if (this.horizontal) {
            const parentTransform = this.content!.node.parent!.getComponent(UITransform)!;
            const currentEndPos = this.margin.x + endIndex / this.column * (this._itemWidth + this.spacing.x);
            
            if (currentEndPos < -offset.x + parentTransform.width) {
                const additionalItems = Math.ceil((-offset.x + parentTransform.width - currentEndPos) / (this.itemWidth + this.spacing.x));
                endIndex += this.column * additionalItems;
            }
        } else {
            const parentTransform = this.content!.node.parent!.getComponent(UITransform)!;
            const currentEndPos = this.margin.y + endIndex / this.column * (this._itemHeight + this.spacing.y);
            
            if (currentEndPos < offset.y + parentTransform.height) {
                const additionalItems = Math.ceil((offset.y + parentTransform.height - currentEndPos) / (this.itemHeight + this.spacing.y));
                endIndex += this.column * additionalItems;
            }
        }

        if (endIndex > this.adapter.getCount()) {
            endIndex = this.adapter.getCount();
            if (!this.scrollBottomNotifyed) {
                this.notifyScrollToBottom();
                this.scrollBottomNotifyed = true;
            }
        }

        return [startIndex * this.column, endIndex];
    }

    getStartIdx(): number | null {
        if (this.adapter == null) return null;

        const offset = this.scrollView!.getScrollOffset();
        let startIndex = 0;

        if (this.horizontal) {
            startIndex = Math.floor(-offset.x / (this._itemWidth + this.spacing.x));
        } else {
            startIndex = Math.floor(offset.y / (this._itemHeight + this.spacing.y));
        }

        if (startIndex < 0) {
            startIndex = 0;
            if (!this.scrollTopNotifyed) {
                this.notifyScrollToTop();
                this.scrollTopNotifyed = true;
                this.scrollBottomNotifyed = true;
            }
        }

        return startIndex;
    }

    init() {
        if (this._isInited) return;

        this._isInited = true;

        if (this.scrollView) {
            this.content = this.scrollView.content.getComponent(UITransform)!;
            const parentTransform = this.content.node.parent!.getComponent(UITransform)!;

            this.horizontal = this.scrollView.horizontal;

            if (this.horizontal) {
                this.scrollView.vertical = false;
                this.content.anchorX = 0;
                this.content.anchorY = parentTransform.anchorY;
                this.content.node.setPosition(0 - parentTransform.width * parentTransform.anchorX, 0);
            } else {
                this.scrollView.vertical = true;
                this.content.anchorX = parentTransform.anchorX;
                this.content.anchorY = 1;
                this.content.node.setPosition(0, parentTransform.height * parentTransform.anchorY);
            }
        } else {
            error('ListView need a scrollView for showing.');
        }

        const sampleNode = this.get();
        const sampleTransform = sampleNode.getComponent(UITransform)!;
        this.put(sampleNode);

        this._itemHeight = sampleTransform.height || 10;
        this._itemWidth = sampleTransform.width || 10;

        const parentTransform = this.content!.node.parent!.getComponent(UITransform)!;
        if (this.horizontal) {
            this._itemsVisible = Math.ceil(parentTransform.width / (this._itemWidth + this.spacing.x));
        } else {
            this._itemsVisible = Math.ceil(parentTransform.height / (this._itemHeight + this.spacing.y));
        }
    }

    notifyScrollToTop() {
        if (!this.adapter || this.adapter.getCount() <= 0) return;
        this.pullDownCallback?.();
    }

    notifyScrollToBottom() {
        if (!this.adapter || this.adapter.getCount() <= 0) return;
        this.pullUpCallback?.();
    }
}