export interface TimeUnit {
    add(t: TimeUnit): TimeUnit;
    subtract(t: TimeUnit): TimeUnit;
    extended(t: TimeUnit): TimeUnit;
    shortened(t: TimeUnit): TimeUnit;

    setTo(t: TimeUnit): TimeUnit;
    copy(): TimeUnit;

    inLongerThan(t: TimeUnit): boolean;
    isShorterThan(t: TimeUnit): boolean;
    isEqualTo(t: TimeUnit): boolean;

    toNanoseconds(): number;
    toMicroSeconds(): number;
    toMilliSeconds(): number;
    toSeconds(): number;
    toMinutes(): number;
    toHours(): number;
    toDays(): number;
    toWeeks(): number;
}


declare module "TimeUnit" {
}

export interface ZurvanConfig {
    timeSinceStartup?: number;
    systemTime?: number;
    acceptEvalTimers?: boolean;
    denyImplicitTimer?: boolean;
    denyTimersShorterThan1Ms?: boolean;
    denyTimersLongerThanInt32?: boolean;
    ignoreProcessTimers?: boolean;
    ignoreDate?: boolean;
    fakeOriginalSetImmediateMethods?: boolean;
    throwOnInvalidClearTimer?: boolean;
    promiseScheduler?: Promise<any>;
    requestedCyclesAroundSetImmediateQueue?: number;
    maxAllowedSetImmediateBatchSize?: number;
    fakeNodeDedicatedTimers?: boolean;
    rejectOnCallbackFailure?: boolean;
    debugLogger?: (log: string) => unknown;
    timerExpirationPolicy?: 'FIFO' | 'Timeouts-First-FIFO' | 'Intervals-First-FIFO' | 'Random' |  'Timeouts-First-Random' | 'Intervals-First-Random'
}

export interface ZurvanTimer {
    dueTime: TimeUnit;
    callDelay: TimeUnit;
    callback: () => unknown;
}

export interface ZurvanLeftovers {
    immediates: object;
    processTime?: [number, number];
    date?: Date;
    timeouts: ZurvanTimer[];
    intervals: ZurvanTimer[];
    currentTime: TimeUnit;
}

export interface Zurvan {
    waitForEmptyQueue(): Promise<unknown>;
    forwardTimeToNextTimer(): Promise<unknown>;
    expireAllTimeouts(): Promise<unknown>;
    advanceTime(howLong: TimeUnit): Promise<unknown>;

    releaseTimers(): Promise<ZurvanLeftovers>;
    interceptTimers(config: ZurvanConfig): Promise<unknown>;
    blockSystem(): unknown;
    forcedReleaseTimers(): ZurvanLeftovers;

    setSystemTime(time: Date | string | number): void;
}

export declare function createZurvanAPI(config: ZurvanConfig): Zurvan;