import type {
    ItemDefaultData,
    Items,
    ItemContents,
    ValueType,
    SpliceChildrenCallbacks,
    SpliceChildrenCallbacksOptions,
    ResultMapper,
    ResultSplitterDefault,
    ResultMapperDefault,
    ResultSplicerDefault,
    ResultSplitterSync,
    ResultSplicerSync,
    ValueChildren,
    ValueItemContent,
} from '../../types.ts'
import type { Check } from 'unist-util-is'
import { is, convert } from 'unist-util-is'
import type { GroupAnchor } from '../generators.ts'
import { groupGenerator } from '../generators.ts'

export type IsDelimiter<TDelimiter extends ValueItemContent[number]> = (node: unknown, index?: Parameters<Check>[1], parent?: Parameters<Check>[2]) => node is TDelimiter
export interface ItemData<TDelimiter extends ValueItemContent[number]> extends ItemDefaultData {
    delimiter: ItemContents<TDelimiter[]>
}
function getIsDelimiter() {
    return convert({ type: "element" as const, tagName: 'br' as const })
}
function getIsDelimiterWithMinCount<TNode extends ValueType, TDelimiter extends ValueItemContent[number]>(isDelimiter: IsDelimiter<TDelimiter>, minCount?: number): GroupAnchor<TNode, 'delimiterItems', TDelimiter[]>['check'] {
    //return (node) => isDelimiter(node)
    if (minCount === undefined || minCount <= 0) {
        return (node) => (isDelimiter(node) ? [node] : []) as TDelimiter[]
    }
    return (_node: unknown, index: number, children: ValueChildren<TNode>, _value: TNode) => {
        let cnt = 0
        for (let i = index; i < children.length && isDelimiter(children[i]); i++) {
            cnt++
        }
        if (cnt >= minCount) {
            return children.slice(index, index + cnt) as TDelimiter[]
        }
        return [] as unknown as TDelimiter[]
    }
}
function getIsNotDelimiterWithMinCount<TNode extends ValueType>(isDelimiter: IsDelimiter<ValueItemContent[number]>, minCount?: number): GroupAnchor<TNode, 'nonDelimiterItems'>['check'] {
    //return (node) => isDelimiter(node)
    if (minCount === undefined || minCount <= 0) {
        return (node) => !isDelimiter(node) ? [node] as ValueChildren<TNode> : []
    }
    return (_node: unknown, index: number, children: ValueChildren<TNode>, _value: TNode) => {
        if (children.length - index < minCount) {
            return children.slice(index, index + (children.length - index)) as ValueChildren<TNode>
        }
        const ret = []
        let i = index
        for (; i < children.length && !isDelimiter(children[i]); i++) {
            ret.push(children[i])
        }
        for (; i < children.length && isDelimiter(children[i]) && (i + 1 >= children.length || i + 1 < children.length && !isDelimiter(children[i + 1])); i++) {
            ret.push(children[i])
        }
        return ret
        return [] as unknown as ValueChildren<TNode>
    }
}
export interface SegmentsOptions<
    TNode extends ValueType,
    TDelimiter extends ValueItemContent[number], // TDelimiter extends ValueChildren<TNode>[number], にすると TNode の型たに制約できるが、扱いにくいと思われるれるので一旦やめた
    //TDelimiter extends ValueChildren<ValueDefaultType>[number],
    TData extends ItemData<TDelimiter>,
    TResultSplitter extends ResultSplitterSync<TNode, TData> = ResultSplitterDefault<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData> = ResultMapperDefault<TNode, TData>, // mapper は外部からら渡されるので同期か非同期は確定していない.
    TResultSplicer extends ResultSplicerSync = ResultSplicerDefault,
> {
    isDelimiter?: IsDelimiter<TDelimiter>
    /**
     * 指定された数だけ isDelimiter が連続して true であるときに区切りとする。
     * 例えば、minCount: 2 とした場合、isDelimiter が 2 回連続して true であるときに区切りとする。
     * なお 0 以下および undefined は 1 を指定したこととみなす。
     * デフォルトは undefined (0 と同じ)。
     */
    minCount?: number
}
export function getCallbacks<
    TNode extends ValueType,
    TDelimiter extends ValueItemContent[number], // TDelimiter extends ValueChildren<TNode>[number], にすると TNode の型たに制約できるが、扱いにくいと思われるれるので一旦やめた
    TData extends ItemData<TDelimiter>,
    TResultSplitter extends ResultSplitterSync<TNode, TData> = ResultSplitterDefault<TNode, TData>,
    TResultMapper extends ResultMapper<TNode, TData> = ResultMapperDefault<TNode, TData>, // mapper は外部からら渡されるので同期か非同期は確定していない.
    TResultSplicer extends ResultSplicerSync = ResultSplicerDefault,
>(
    options: SegmentsOptions<TNode, TDelimiter, TData, TResultSplitter, TResultMapper, TResultSplicer>
): Omit<SpliceChildrenCallbacks<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>, 'mapper'> &
    Omit<SpliceChildrenCallbacksOptions<TNode, TData, TResultSplitter, TResultMapper, TResultSplicer>, 'mapperReturnsPromise'> {
    const isDelimiter = options.isDelimiter || getIsDelimiter()
    const isNotDelimiterValid = getIsNotDelimiterWithMinCount(isDelimiter, options.minCount)
    const isDelimiterValid = getIsDelimiterWithMinCount<TNode, TDelimiter | { type: 'element', tagName: 'br' }>(isDelimiter, options.minCount)
    return {
        splitter: (children, value) => {
            const segments: Items<ValueChildren<TNode>, TData> = []
            const anchors: GroupAnchor<TNode, 'nonDelimiterItems' | 'delimiterItems'>[] = [
                { label: 'nonDelimiterItems', check: (...args) => isNotDelimiterValid(...args) },
                { label: 'delimiterItems', check: (...args) => isDelimiterValid(...args) }
            ]
            const grouped = groupGenerator(children, value, { anchors })
            for (const group of grouped) {
                const { nonDelimiterItems, delimiterItems } = group
                const index = nonDelimiterItems.length > 0 ? nonDelimiterItems[0].index : delimiterItems[0].index // どちらも 0 はありえない
                segments.push({
                    //contents: nonDelimiterItems.map((item) => item.contents),
                    contents: nonDelimiterItems.map((item) => item.contents).flat() as ValueChildren<TNode>,
                    data: {
                        //delimiter: delimiterItems.map((item) => item.contents), // as ValueChildren<TNode>[number][],
                        delimiter: delimiterItems.map((item) => item.contents).flat() as TDelimiter[],
                        index,
                    } as TData
                })
            }
            return segments as TResultSplitter
        },
        splicer: (children, value, items) => {
            const newChildren: ItemContents<ValueChildren<TNode>> = [] as unknown as ItemContents<ValueChildren<TNode>>
            for (const item of items) {
                newChildren.push(...item.contents)
                newChildren.push(...item.data.delimiter || [])
            }
            children.splice(0, children.length, ...newChildren)
            return void 0 as TResultSplicer
        }
    }
}
//export const getSplitter = function (options: SplitterOptions = {}) {
//    const isDelimiter = options.isDelimiter || getIsDelimiter()
//    return (value: ValueDefaultType) => {
//        const segments: Items<ItemData> = []
//        const anchors: GroupAnchor<'nonDelimiterItems' | 'delimiterItems'>[] = [
//            { label: 'nonDelimiterItems', check: (node) => !isDelimiter(node as Nodes) },
//            { label: 'delimiterItems', check: (node) => isDelimiter(node as Nodes) }
//        ]
//        const grouped = groupGenerator(value, { anchors })
//        if (options.mergeDelimiters) {
//            for (const group of grouped) {
//                const { nonDelimiterItems, delimiterItems } = group
//                const index = nonDelimiterItems.length > 0 ? nonDelimiterItems[0].index : delimiterItems[0].index // どちらも 0 はありえない
//                segments.push({
//                    contents: nonDelimiterItems.map((item) => item.content),
//                    data: {
//                        delimiter: delimiterItems.map((item) => item.content),
//                        index,
//                    }
//                })
//            }
//        } else {
//            for (const group of grouped) {
//                const { nonDelimiterItems, delimiterItems } = group
//                const index = nonDelimiterItems.length > 0 ? nonDelimiterItems[0].index : delimiterItems[0].index // どちらも 0 はありえない
//                segments.push({
//                    contents: nonDelimiterItems.map((item) => item.content),
//                    data: {
//                        delimiter: delimiterItems.length > 0 ? [delimiterItems[0].content] : [],
//                        index,
//                    }
//                })
//                const extraDelimiters = delimiterItems.slice(1)
//                for (const extraDelimiter of extraDelimiters) {
//                    segments.push({
//                        contents: [],
//                        data: {
//                            delimiter: [extraDelimiter.content],
//                            index: extraDelimiter.index,
//                        }
//                    })
//                }
//            }
//        }
//        return segments
//    }
//}
//export const getSplicer = function () {
//    return (value: ValueDefaultType, segments: Items<Segments.ItemData>) => {
//        const newChildren: ItemContents = []
//        for (const segment of segments) {
//            newChildren.push(...segment.contents)
//            newChildren.push(...segment.data?.delimiter || [])
//        }
//        value.children.splice(0, value.children.length, ...newChildren)
//    }
//}
