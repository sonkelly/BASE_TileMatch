export interface Reporter {
    init(): void;
    reportEvent(name: string, params?: Record<string, any>): void;
    beginTimeEvent(name: string): void;
    setUserProperty(props: Record<string, any>): void;
    setOnceUserProperty(props: Record<string, any>): void;
    incUserProperty(props: Record<string, number>): void;
}

export class AggregatedReporter {
    private reporters: Reporter[] = [];

    setReporters(reporters: Reporter[]): void {
        this.reporters = reporters;
    }

    init(): void {
        for (const r of this.reporters) {
            r.init();
        }
    }

    reportEvent(name: string, params?: Record<string, any>): void {
        for (const r of this.reporters) {
            r.reportEvent(name, params);
        }
    }

    beginTimeEvent(name: string): void {
        for (const r of this.reporters) {
            r.beginTimeEvent(name);
        }
    }

    setUserProperty(props: Record<string, any>): void {
        for (const r of this.reporters) {
            r.setUserProperty(props);
        }
    }

    setOnceUserProperty(props: Record<string, any>): void {
        for (const r of this.reporters) {
            r.setOnceUserProperty(props);
        }
    }

    incUserProperty(props: Record<string, number>): void {
        for (const r of this.reporters) {
            r.incUserProperty(props);
        }
    }
}