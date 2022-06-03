class Timer {
    globalTimer = 0
    #timers: Record<string, number> = {}

    public debug(...data: any[]): void {
        if (process.env.NODE_ENV !== 'development') return

        console.log(...data)
    }

    public startGlobalTimer(): void {
        this.globalTimer = new Date().getTime()
    }

    public globalElapsed(): number {
        return (new Date().getTime() - this.globalTimer) / 1000
    }

    public startTimer(key: string): void {
        this.#timers[key] = new Date().getTime()

        this.debug(`${this.globalTimer ? `${this.globalElapsed()}s:` : ''} started loading ${key}`)
    }

    public endTimer(key: string, msg = ''): number {
        const elapsed = (new Date().getTime() - this.#timers[key]) / 1000
        delete this.#timers[key]

        this.debug(`${this.globalTimer ? `${this.globalElapsed()}s:` : ''} ${key} took ${elapsed}s`, msg)

        return elapsed
    }

    public time<T>(key: string, op: () => T): T {
        this.startTimer(key)
        const result = op()
        this.endTimer(key)

        return result
    }
}

export default new Timer()
