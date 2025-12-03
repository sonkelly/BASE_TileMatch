import { _decorator, Node, UITransform, Tween, tween, v3, Vec3, easing, cclegacy } from 'cc';
import { AsyncQueue } from './AsyncQueue';
import {ListView} from './ListView';
import {ListViewAdapter} from './ListViewAdapter';
import { MgrStar, StarEagueTipUpRank, StarEagueTipDownRank } from './MgrStar';
import { StarEagueItem } from './StarEagueItem';
import { StarEagueItemSelf } from './StarEagueItemSelf';
import {values} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('StarEagueRank')
export class StarEagueRank extends ListViewAdapter {
    @property(ListView)
    listView: ListView = null!;

    @property(Node)
    blackNode: Node = null!;

    @property(StarEagueItemSelf)
    selfRank: StarEagueItemSelf = null!;

    private delegate: any = null;
    private _prevRankDatas: any = null;
    private _curRankDatas: any = null;
    private _changeAsyncQueue: AsyncQueue = new AsyncQueue();

    onLoad() {
        this.listView.setAdapter(this);
    }

    onDisable() {
        this._changeAsyncQueue.clear();
    }

    private _onClickClose() {
        this.delegate?.onClickClose?.();
    }

    private _showBlack() {
        this.blackNode.active = true;
    }

    private _hideBlack() {
        this.blackNode.active = false;
    }

    playRankChange(callback?: Function) {
        this._prevRankDatas = MgrStar.Instance.getPrevRankData();
        this._curRankDatas = MgrStar.Instance.getRankData();
        
        const rankChanged = this._curRankDatas.selfData.rank !== this._prevRankDatas.selfData.rank;
        const starChanged = this._curRankDatas.selfData.star !== this._prevRankDatas.selfData.star;
        
        if (rankChanged) {
            this._playRankChange(callback);
        } else if (starChanged) {
            this._playStarChange(callback);
        } else {
            this._playNoChange(callback);
        }
    }

    private _playRankChange(callback?: Function) {
        const self = this;
        const prevRank = this._prevRankDatas.selfData.rank;
        const prevStar = MgrStar.Instance.prevStar;
        const curRank = this._curRankDatas.selfData.rank;
        const curStar = MgrStar.Instance.starData.star;

        this.selfRank.refreshRankData(this._curRankDatas.selfData);
        this.selfRank.node.active = false;
        this._showBlack();

        let prevIndex = prevRank <= StarEagueTipUpRank ? prevRank - 1 : 
                       prevRank <= StarEagueTipDownRank ? prevRank : prevRank + 1;
        
        let curIndex = curRank <= StarEagueTipUpRank ? curRank - 1 : 
                      curRank <= StarEagueTipDownRank ? curRank : curRank + 1;

        this._curRankDatas.rankData.splice(curIndex, 1);
        this.setDataSet(this._curRankDatas.rankData);
        this.listView.notifyUpdate(true);

        const direction = curRank > prevRank ? 1 : -0.5;
        this.listView.scrollToPage(prevIndex - 0.5 * this.listView.visibleCount + direction, 1, 0);

        const tempData = {
            rank: this._prevRankDatas.selfData.rank,
            rTime: this._prevRankDatas.selfData.rTime,
            id: this._prevRankDatas.selfData.id,
            star: prevStar,
            me: true
        };

        const tempItem = this.listView.get();
        tempItem.parent = this.listView.getScrollView().content.parent;
        tempItem.getComponent(StarEagueItem).refreshRankData(tempData);
        this.listView.layoutView(tempItem, prevIndex);

        const originalPos = tempItem.position;
        const worldPos = this.listView.getScrollView().content.getComponent(UITransform).convertToWorldSpaceAR(originalPos);
        tempItem.position = tempItem.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

        this._changeAsyncQueue.clear();
        
        this._changeAsyncQueue.push((next: Function) => {
            tween(tempItem)
                .delay(0.3)
                .to(0.12, { scale: v3(1.2, 1.2, 1.2) })
                .call(() => next())
                .start();
        });

        const visibleElements = this.listView.getVisibleElements();
        
        this._changeAsyncQueue.push((next: Function) => {
            const duration = 0.8;
            this.listView.scrollToPage(curIndex - 0.5 * this.listView.visibleCount, 1, duration);
            
            const itemComp = tempItem.getComponent(StarEagueItem);
            tween(tempData)
                .to(0.8 * duration, { star: curStar, rank: curRank }, {
                    easing: easing.sineOut,
                    onUpdate: () => {
                        const rank = Math.ceil(tempData.rank);
                        const star = Math.ceil(tempData.star);
                        itemComp.setRank(rank);
                        itemComp.setStar(star);
                    }
                })
                .call(() => {
                    itemComp.setRank(curRank);
                    itemComp.setStar(curStar);
                })
                .start();

            const targetY = curIndex < 0.5 * visibleElements ? curIndex : 0.5 * visibleElements;
            const targetHeight = 0.5 * this.listView.getScrollView().content.parent.getComponent(UITransform).height - 
                               targetY * this.listView.getColumnWH() - 
                               this.listView.margin.y - 
                               0.5 * this.listView.getColumnWH();
            const targetPos = v3(0, targetHeight, 0);
            
            tween(tempItem)
                .to(0.4, { position: targetPos })
                .start();
                
            this.scheduleOnce(next, duration);
        });

        this._changeAsyncQueue.push((next: Function) => {
            this.listView.enabled = false;
            
            const items = this.listView.getItems();
            const _values = values(items);
            
            for (let i = 0; i < _values.length; i++) {
                const item = _values[i];
                if (item && item.getComponent(StarEagueItem).data.rank > curRank) {
                    tween(item)
                        .by(0.1, { position: v3(0, -this.listView.getColumnWH(), 0) })
                        .start();
                }
            }
            
            if (curIndex > 0.5 * visibleElements) {
                tween(this.listView.getScrollView().content)
                    .by(0.1, { position: v3(0, 0.5 * this.listView.getColumnWH(), 0) })
                    .start();
            }
            
            tween(tempItem)
                .to(0.1, { scale: Vec3.ONE }, { easing: easing.backOut })
                .call(next)
                .start();
        });

        this._changeAsyncQueue.push((next: Function) => {
            Tween.stopAllByTarget(tempItem);
            this.listView.put(tempItem);
            this._curRankDatas.rankData.splice(curIndex, 0, this._curRankDatas.selfData);
            this.listView.enabled = true;
            this.listView.notifyUpdate();
            next();
        });

        this._changeAsyncQueue.complete = () => {
            MgrStar.Instance.resetPrevStar();
            this._hideBlack();
            callback?.();
        };

        this._changeAsyncQueue.play();
    }

    private _playStarChange(callback?: Function) {
        const self = this;
        this._showBlack();
        this.selfRank.refreshRankData(this._curRankDatas.selfData);
        this.setDataSet(this._curRankDatas.rankData);
        this.listView.notifyUpdate();
        this.selfRank.node.active = false;

        let index = this._curRankDatas.selfData.rank <= StarEagueTipUpRank ? 
                   this._curRankDatas.selfData.rank - 1 : 
                   this._curRankDatas.selfData.rank <= StarEagueTipDownRank ? 
                   this._curRankDatas.selfData.rank : 
                   this._curRankDatas.selfData.rank + 1;
        
        this.listView.scrollToPage(index - 0.5 * this.listView.visibleCount, 1, 0);
        
        this.scheduleOnce(() => {
            const matchedItem = this.listView.getMatchItem((item: Node) => {
                return item.getComponent(StarEagueItem).data.me === true;
            });
            
            if (matchedItem) {
                const prevStar = MgrStar.Instance.prevStar;
                const curStar = MgrStar.Instance.starData.star;
                
                matchedItem.getComponent(StarEagueItem).playStarChange(prevStar, curStar, () => {
                    this._hideBlack();
                    callback?.();
                });
            } else {
                this._hideBlack();
                callback?.();
            }
        });
    }

    private _playNoChange(callback?: Function) {
        this._showBlack();
        this.setDataSet(this._curRankDatas.rankData);
        this.listView.notifyUpdate();
        this.selfRank.node.active = true;
        this.listView.scrollToPage(0, 1, 0);
        this.selfRank.refreshRankData(this._curRankDatas.selfData);
        this._hideBlack();
        callback?.();
    }

    updateView(item: Node, index: number, data: any) {
        item.getComponent(StarEagueItem).refreshRankData(data);
    }
}