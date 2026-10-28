import { getDefaultMapper, getDefaultSplicer, getDefaultSplitter } from '../../splice.ts'
import type {
    ItemDefaultData,
    ValueType,
    SpliceChildrenCallbacks,
    SpliceChildrenCallbacksOptions,
    ResultSplitterDefault,
    ResultMapperDefault,
    ResultSplicerDefault,
    ResultSplitterSync,
    ResultMapperSync,
    ResultSplicerSync
} from '../../types.js'

export type ItemData<TLabel extends string> = ItemDefaultData & {
    label: TLabel
}
export interface BasicOptions<
    TNode extends ValueType,
    TData extends ItemDefaultData,
    TResultSplitter extends ResultSplitterSync<TNode, TData>,
    TResultMapper extends ResultMapperSync<TNode, TData>,
    TResultSplicer extends ResultSplicerSync
> { }
export function getCallbacks<
    TNode extends ValueType,
    TData extends ItemDefaultData = ItemDefaultData,
    TResultSplitter extends ResultSplitterSync<TNode, TData> = ResultSplitterDefault<TNode, TData>,
    TResultMapper extends ResultMapperSync<TNode, TData> = ResultMapperDefault<TNode, TData>,
    TResultSplicer extends ResultSplicerSync = ResultSplicerDefault
>(
    options: BasicOptions<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> = {}
): SpliceChildrenCallbacks<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> &
    SpliceChildrenCallbacksOptions<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer> {
    return {
        splitter: getDefaultSplitter(),
        mapper: getDefaultMapper(),
        splicer: getDefaultSplicer(),
    }
}
