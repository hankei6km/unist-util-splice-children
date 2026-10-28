import type { ItemDefaultData, ValueChildren, ValueType, ValueDefaultType, SpliceChildrenOptions, NormalizedSpliceChildrenOptions, Items, Item, ResultSplitter, ResultSplitterDefault, ResultSplicerDefault, ResultMapper, ResultMapperDefault, ResultSplicer, Splitter, Mapper, Splicer, ResultSplitterSync, ResultMapperSync, ResultSplicerSync, ResultSplitterAsync, ResultMapperAsync, ResultSplicerAsync } from './types.ts'


export function getDefaultSplitter<
    TNode extends ValueType,
    TData extends ItemDefaultData = ItemDefaultData,
    TResultSplitter extends ResultSplitterSync<TNode, TData> = ResultSplitterDefault<TNode, TData>,
>(): Splitter<TNode, TData, TResultSplitter> {
    return function defaultSplitter(children, value) {
        return children.map((child, index) => ({
            contents: [child],
            data: {
                index
            }
        })) as TResultSplitter
    }
}

export function getDefaultMapper<
    TNode extends ValueType,
    TData extends ItemDefaultData = ItemDefaultData,
    TResultMapper extends ResultMapperDefault<TNode, TData> = ResultMapperDefault<TNode, TData>,
>(): Mapper<TNode, TData, TResultMapper> {
    return function (item) {
        return [item] as TResultMapper
    }
}

export function getDefaultSplicer<
    TNode extends ValueType,
    TData extends ItemDefaultData = ItemDefaultData,
    TResultSplicer extends ResultSplicerDefault = ResultSplicerDefault,
>(): Splicer<TNode, TData, TResultSplicer> {
    return function (children, value, items) {
        const newChildren = []
        for (const item of items) {
            newChildren.push(...item.contents)
        }
        children.splice(0, children.length, ...newChildren)
        return void 0 as TResultSplicer
    }
}

export function normalizedSpliceChildrenOptions<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer
>(options: SpliceChildrenOptions<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>):
    NormalizedSpliceChildrenOptions<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> {
    const ret: NormalizedSpliceChildrenOptions<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> = {
        splitter: options.splitter,
        mapper: options.mapper,
        splicer: options.splicer,
    }
    if (typeof options.splitterReturnsPromise === 'boolean') {
        ret.splitterReturnsPromise = options.splitterReturnsPromise
    }
    if (typeof options.mapperReturnsPromise === 'boolean') {
        ret.mapperReturnsPromise = options.mapperReturnsPromise
    }
    if (typeof options.splicerReturnsPromise === 'boolean') {
        ret.splicerReturnsPromise = options.splicerReturnsPromise
    }
    return ret
}

type MaybePromiseVoid<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData> = ResultSplitterDefault<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData> = ResultMapperDefault<TNode, TData>,
    TResultSplicer extends ResultSplicer = ResultSplicerDefault
> = [SpliceChildrenOptions<
    TNode,
    TData,
    TResultSplitter,
    TResultMapper,
    TResultSplicer
>['splitterReturnsPromise'],
    SpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >['mapperReturnsPromise'],
    SpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >['splicerReturnsPromise'],
] extends [false | undefined, false | undefined, false | undefined]
    ? void
    : Promise<void>


function getChildren<TNode extends ValueType>(value: TNode): ValueChildren<TNode> {
    return (typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.children) ? value.children : value) as unknown as ValueChildren<TNode>
}

function spliceChildrenSync<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitterSync<TNode, TData>,//= ResultSplitterDefault<TNode, TData>,
    TResultMapper extends ResultMapperSync<TNode, TData>,// = ResultMapperDefault<TNode, TData>,
    TResultSplicer extends ResultSplicerSync,// = ResultSplicerDefault
>(
    value: TNode,
    options: NormalizedSpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >
): void {
    const { splitter, mapper, splicer } = options
    //const items: TResultSplitter = splitter(Array.isArray(value) ? value : value.children, value)
    const items: TResultSplitter = splitter(getChildren(value), value)
    const mappedItems: Items<ValueChildren<TNode>, TData> = []
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const mapped = mapper(item, i, items, value)
        mappedItems.push(...mapped)
    }
    splicer(getChildren(value), value, mappedItems)
}

async function spliceChildrenAsync<
    TNode extends ValueType,//= ValueDefaultType,
    TData extends ItemDefaultData,//= ItemDefaultData,
    TResultSplitter extends ResultSplitterAsync<TNode, TData>,// = ResultSplitterDefault<TNode, TData>,
    TResultMapper extends ResultMapperAsync<TNode, TData>,// = ResultMapperDefault<TNode, TData>,
    TResultSplicer extends ResultSplicerAsync,// = ResultSplicerDefault
>(
    value: TNode,
    options: NormalizedSpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >
): Promise<void> {
    const { splitter, mapper, splicer } = options
    const items = await splitter(getChildren(value), value)
    const mappedItems: Items<ValueChildren<TNode>, TData> = []
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const mapped = await mapper(item, i, items, value)
        mappedItems.push(...mapped)
    }
    await splicer(getChildren(value), value, mappedItems)
}

export function spliceChildren<
    //TNode extends ValueType = ValueDefaultType,
    //TData extends ItemDefaultData = ItemDefaultData,
    //TResultSplitter extends ResultSplitter<TNode, TData> = ResultSplitterDefault<TNode, TData>,
    //TResultMapper extends ResultMapper<TNode, TData> = ResultMapperDefault<TNode, TData>,
    //TResultSplicer extends ResultSplicer = ResultSplicerDefault
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer
>(
    value: TNode,
    options: SpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >
): MaybePromiseVoid<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> {
    const normalizedOptions = (normalizedSpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >(options))
    if (normalizedOptions.splitterReturnsPromise !== true &&
        normalizedOptions.mapperReturnsPromise !== true &&
        normalizedOptions.splicerReturnsPromise !== true) {
        return spliceChildrenSync(value, normalizedOptions as NormalizedSpliceChildrenOptions<TNode, TData, ResultSplitterSync<TNode, TData>, ResultMapperSync<TNode, TData>, ResultSplicerSync>) as MaybePromiseVoid<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>
    } else {
        return spliceChildrenAsync(value, normalizedOptions as NormalizedSpliceChildrenOptions<TNode, TData, ResultSplitterAsync<TNode, TData>, ResultMapperAsync<TNode, TData>, ResultSplicerAsync>) as MaybePromiseVoid<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>
    }
}

/*
splitterReturnsPromise と splicerReturnsPromise を利用せずに動的に非同期処理するバージョン。
初期の頃のものなので動作するかは不明。
export function spliceChildren<
    //TNode extends ValueType = ValueDefaultType,
    //TData extends ItemDefaultData = ItemDefaultData,
    //TResultSplitter extends ResultSplitter<TNode, TData> = ResultSplitterDefault<TNode, TData>,
    //TResultMapper extends ResultMapper<TNode, TData> = ResultMapperDefault<TNode, TData>,
    //TResultSplicer extends ResultSplicer = ResultSplicerDefault
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer
>(
    value: TNode,
    options: SpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >
): MaybePromiseVoid<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> {
    const normalizedOptions = (normalizedSpliceChildrenOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    >(options))
    const { splitter, mapper, splicer } = normalizedOptions
    let checkSync = false
    let release: (value?: void) => void = () => { }
    let fail: (reason: any) => void = (_reason: any) => {}
    let p: Promise<void> | undefined
    try {
        unWrapPromise(splitter(value), (items, isSyncSplitter) => {
            flatMapAsync(items, ((item, index) => mapper(item, index, items, value)), (mappedItems, isSyncMapper) => {
                unWrapPromise(splicer(value, mappedItems), (_result, isSyncSplicer) => {
                    if (isSyncSplitter && isSyncMapper && isSyncSplicer) {
                        checkSync = true
                    } else {
                        release()
                    }
                }, (err) => {
                    if (p) {
                        fail(err)
                    } else {
                        throw err
                    }
                })
            }, (err) => {
                if (p) {
                    fail(err)
                } else {
                    throw err
                }
            },
                { returnsPromise: options.mapperReturnsPromise === true })
        }, (err) => {
            if (p) {
                fail(err)
            } else {
                throw err
            }
        })
    } catch (err) {
        if (p) {
            fail(err)
        } else {
            throw err
        }
    }
    if (checkSync) {
        return void 0 as MaybePromiseVoid<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>
    } else {
        p = new Promise<void>((resolve, reject) => {
            release = resolve
            fail = reject
        })
        return p as MaybePromiseVoid<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>
    }
}
*/
