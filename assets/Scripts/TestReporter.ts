import { _decorator, Component, log } from 'cc';
const { ccclass } = _decorator;

@ccclass('TestReporter')
export class TestReporter extends Component {
    
    init() {}
    
    reportEvent(eventName: string, eventData: any) {
        const dataString = JSON.stringify(eventData);
        log(`TestReporter.reportEvent(), eventName=${eventName};eventData=${dataString}`);
    }
    
    beginTimeEvent(eventName: string) {
        log(`TestReporter.beginTimeEvent(), eventName=${eventName}`);
    }
    
    setUserProperty(properties: any) {
        log(`TestReporter.setUserProperty(), properties=${JSON.stringify(properties)}`);
    }
    
    setOnceUserProperty(properties: any) {
        log(`TestReporter.setOnceUserProperty(), properties=${JSON.stringify(properties)}`);
    }
    
    incUserProperty(properties: any) {
        log(`TestReporter.incUserProperty(), properties=${JSON.stringify(properties)}`);
    }
}