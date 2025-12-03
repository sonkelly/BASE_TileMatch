import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

export enum ChannelType {
    Test = 0,
    WeChat = 1,
    TT = 2,
    FaceBook = 3,
    Android = 4
}

@ccclass('ChannelManager')
class ChannelManager{
    
    private channelType: ChannelType = ChannelType.FaceBook;

    init(): void {
        this.channelType = ChannelType.Test; //@todo set SDK here
    }

    getChannelType(): ChannelType {
        return this.channelType;
    }
}
const channelManager = new ChannelManager();
const getChannelType = channelManager.getChannelType.bind(channelManager);
export {channelManager, getChannelType};