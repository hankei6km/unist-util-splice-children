import type { Node, Parent } from 'unist'

export type ValueChildren<TNode extends ValueType> = TNode extends Parent ? TNode['children'] : TNode
//export type ValueChildren<TNode extends ValueType> = TNode extends Array<Node> ? TNode : TNode extends Parent ? TNode['children'] : TNode

export type ResultSplitterDefault<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = Items<ValueChildren<TNode>, TData>
export type ResultSplitterSync<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = Items<ValueChildren<TNode>, TData>
export type ResultSplitterAsync<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = Promise<ResultSplitterSync<TNode, TData>>
export type ResultSplitter<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = ResultSplitterSync<TNode, TData> | ResultSplitterAsync<TNode, TData>

export type ResultMapperDefault<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = Item<ValueChildren<TNode>, TData>[]
export type ResultMapperSync<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = Item<ValueChildren<TNode>, TData>[]
export type ResultMapperAsync<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = Promise<Item<ValueChildren<TNode>, TData>[]>
export type ResultMapper<
    TNode extends ValueType,
    TData extends ItemDefaultData
> = ResultMapperSync<TNode, TData> | ResultMapperAsync<TNode, TData>

export type ResultSplicerDefault = void
export type ResultSplicerSync = void
export type ResultSplicerAsync = Promise<void>
export type ResultSplicer = ResultSplicerSync | ResultSplicerAsync

export interface Splitter<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResult extends ResultSplitter<TNode, TData> = ResultSplitterDefault<TNode, TData>
> {
    (children: ValueChildren<TNode>, value: TNode): TResult
}
export interface Mapper<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResult extends ResultMapper<TNode, TData>
> {
    (item: Item<ValueChildren<TNode>, TData>, index: number, items: Items<ValueChildren<TNode>, TData>, value: TNode): TResult
}
export interface Splicer<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResult extends ResultSplicer
> {
    (children: ValueChildren<TNode>, value: TNode, items: Items<ValueChildren<TNode>, TData>): TResult
}
export interface SpliceChildrenCallbackSplitter<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResult extends ResultSplitter<TNode, TData>
> {
    splitter: Splitter<TNode, TData, TResult>
}
export interface SpliceChildrenCallbackMapper<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResult extends ResultMapper<TNode, TData>
> {
    mapper: Mapper<TNode, TData, TResult>
}
export interface SpliceChildrenCallbackSplicer<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResult extends ResultSplicer
> {
    splicer: Splicer<TNode, TData, TResult>
}
export interface SpliceChildrenCallbacks<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer
> extends
    SpliceChildrenCallbackSplitter<TNode, TData, TResultSplitter>,
    SpliceChildrenCallbackMapper<TNode, TData, TResultMapper>,
    SpliceChildrenCallbackSplicer<TNode, TData, TResultSplicer> {
}
interface SpliceChildrenCallbacksOptionsSplitterRerurnsPromiseBase {
    splitterReturnsPromise: true
}
interface SpliceChildrenCallbacksOptionsSplitterRerurnsNotPromise {
    splitterReturnsPromise?: false
}
interface SpliceChildrenCallbacksOptionsMapperRerurnsPromiseBase {
    mapperReturnsPromise: true
}
interface SpliceChildrenCallbacksOptionsMapperRerurnsNotPromise {
    mapperReturnsPromise?: false
}
interface SpliceChildrenCallbacksOptionsSplicerRerurnsPromiseBase {
    splicerReturnsPromise: true
}
interface SpliceChildrenCallbacksOptionsSplicerRerurnsNotPromise {
    splicerReturnsPromise?: false
}
export interface SpliceChildrenCallbacksOptions<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer
> extends
    Pick<
        TResultSplitter extends ResultSplitterDefault<TNode, TData> ?
        SpliceChildrenCallbacksOptionsSplitterRerurnsNotPromise :
        SpliceChildrenCallbacksOptionsSplitterRerurnsPromiseBase, 'splitterReturnsPromise'>,
    Pick<
        TResultMapper extends ResultMapperDefault<TNode, TData> ?
        SpliceChildrenCallbacksOptionsMapperRerurnsNotPromise :
        SpliceChildrenCallbacksOptionsMapperRerurnsPromiseBase, 'mapperReturnsPromise'>,
    Pick<
        TResultSplicer extends ResultSplicerDefault ?
        SpliceChildrenCallbacksOptionsSplicerRerurnsNotPromise :
        SpliceChildrenCallbacksOptionsSplicerRerurnsPromiseBase, 'splicerReturnsPromise'> { }

export interface SpliceChildrenOptions<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer,
> extends SpliceChildrenCallbacks<
    TNode,
    TData,
    TResultSplitter,
    TResultMapper,
    TResultSplicer
>, SpliceChildrenCallbacksOptions<
    TNode,
    TData,
    TResultSplitter,
    TResultMapper,
    TResultSplicer
> {

}

/*
    'mapperReturnsPromise': TResultMapper extends ResultMapperDefault<TNode, TData> ? undefined : true
}*/

export interface ItemDefaultData {
    index: number
}

export type ValueItemContent = Node[]
export type ItemContents<TItemContent extends ValueItemContent = ValueItemContent> = TItemContent
//export type ItemContents<TNode extends ValueType = ValueDefaultType> = Root['children'] & Element['children']
//export type ItemContents<TNode extends ValueType = ValueDefaultType> = TNode['children']
//export type ItemContents<TNode extends ValueType = ValueDefaultType> = TNode extends Root ? Root['children'] :
//    TNode extends Element ? Element['children'] :
//    Root['children'] & Element['children']

export interface Item<TItemContent extends ValueItemContent, TData extends ItemDefaultData> {
    contents: ItemContents<TItemContent>
    data: TData
}
export type Items<TItemContent extends ValueItemContent, TData extends ItemDefaultData> = Item<TItemContent, TData>[]
//export type ValueType = Nodes
export type ValueType = Parent | Parent['children']
export type ValueDefaultType = Parent


export interface NormalizedSpliceChildrenOptions<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitter<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData>,
    TResultSplicer extends ResultSplicer
>
    extends Required<
        Omit<SpliceChildrenOptions<
            TNode,
            TData,
            TResultSplitter,
            TResultMapper,
            TResultSplicer
        >, 'splitterReturnsPromise' | 'mapperReturnsPromise' | 'splicerReturnsPromise'>
    >, SpliceChildrenCallbacksOptions<
        TNode,
        TData,
        TResultSplitter,
        TResultMapper,
        TResultSplicer
    > {
}
