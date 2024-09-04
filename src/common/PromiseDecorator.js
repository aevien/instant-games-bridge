class PromiseDecorator {
    #promise

    #resolve

    #reject

    get promise() {
        return this.#promise
    }

    constructor() {
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve
            this.#reject = reject
        })
    }

    resolve(data) {
        this.#resolve(data)
    }

    reject(error) {
        this.#reject(error)
    }
}

export default PromiseDecorator
