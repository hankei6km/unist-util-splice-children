
export function unWrapPromise<T>(value: T | Promise<T>, fn: (value: T, isSync?: boolean) => void, error: (err: any) => void): void {
    if (value instanceof Promise) {
        value.then(fn).catch(error)
    } else {
        fn(value, true)
    }
}

function _flatMapAsync<T, U>( // callback の戻り値から非同期判定を行うバージョン(arrat.length === 0 のとき定義と実装がずれる)。現在は未使用
    array: T[],
    callback: (item: T, index: number, array: T[]) => (U | ReadonlyArray<U>) | Promise<(U | ReadonlyArray<U>)>,
    error: (err: any) => void,
    fn: (value: U[], isSync?: boolean) => void
): void | Promise<void> {
    if (array.length === 0) {
        // callback が非同期的動作のとき、定義と実装がずれるときがある.
        // async function ではなく Promise を返す関数の場合は考慮されない.
        if (typeof callback === 'function' && (callback as any).constructor?.name === 'AsyncFunction') {
            fn([])
        } else {
            fn([], true)
        }
        return
    }
    unWrapPromise(callback(array[0], 0, array), (firstResult, isSync) => {
        if (isSync) {
            fn([...(firstResult instanceof Array ? firstResult : [firstResult]), ...array.slice(1).flatMap((item, index) => {
                return callback(item, index + 1, array)
            })] as U[], true)
        } else {
            (async () => {
                const results = [...(firstResult instanceof Array ? firstResult : [firstResult])]
                for (const item of array.slice(1)) { //
                    const result = await callback(item, results.length, array)
                    results.push(...(result instanceof Array ? result : [result]))
                }
                return results
            })().then((results) => {
                fn(results)
            }).catch(error)
        }
    }, error)
}

export function flatMapAsync<T, U>(
    array: T[],
    callback: (item: T, index: number, array: T[]) => (U | ReadonlyArray<U>) | Promise<(U | ReadonlyArray<U>)>,
    fn: (value: U[], isSync?: boolean) => void,
    error: (err: any) => void,
    options: {
        returnsPromise: boolean
    }
): void | Promise<void> {
    if (!options.returnsPromise) {
        fn(array.flatMap((item, index) => {
            return callback(item, index, array)
        }) as U[], true)
    } else {
        (async () => {
            // どうせなら並行処理や逆に
            // (fetch を短時間で複数実行するとよくないような場合などを想定し)
            // 間隔をあけて実行するような対応もできるようにしたい。
            const results = []
            for (let i = 0; i < array.length; i++) { // flatMap 的操作
                const result = await callback(array[i], i, array)
                results.push(...result as Awaited<U[]>)
            }
            return results
        })().then((results) => {
            fn(results)
        }).catch(error)
    }
}
