import type { ValueType, ItemContents, ValueDefaultType, ValueChildren, ValueItemContent, Item } from '../types.ts'

// generators 現時点では外部へエクスポートしない。
// unist のユーティリティで generator はあまり見かけない。
// 配列をいくつも作るのもどうかと思ったので、内部的には generator を利用した。
export interface GroupAnchor<TNode extends ValueType, TLabel extends string = string, TItemContent extends ValueItemContent = ValueItemContent> {
    label: TLabel,
    check: (node: unknown, index: number, children: ValueChildren<TNode>, value: TNode) => ItemContents<TItemContent>
}
export interface GroupOptions<TNode extends ValueType, TLabel extends string = string, TItemContent extends ValueItemContent = ValueItemContent> {
    anchors: GroupAnchor<TNode, TLabel, TItemContent>[]
}
export type GroupItem<TItemContent extends ValueItemContent = ValueItemContent> = {
    contents: ItemContents<TItemContent>
    index: number
}[]

//export type GroupResult<TNode extends ValueType, TLabel extends string, TItemContent extends ValueItemContent = ValueChildren<TNode>, TAnchor extends GroupAnchor<TNode, TLabel, TItemContent> = GroupAnchor<TNode, TLabel, TItemContent>> = Record<TAnchor['label'], GroupItem<ReturnType<TAnchor['check']>>>
export type GroupResult<TNode extends ValueType, TAnchor extends GroupAnchor<TNode>>
    = Record<TAnchor['label'], GroupItem<ReturnType<TAnchor['check']>>>

const statNum = (stat: boolean | number) => {
    if (typeof stat === 'boolean') {
        return stat ? 1 : 0
    }
    // TODO: stat が負の数の場合はどうするか？
    return stat
}

interface GroupGenerator {
    <TNode extends ValueType, TOptions extends GroupOptions<TNode>>
        (children: ValueChildren<TNode>, value: TNode, options: TOptions): Generator<GroupResult<TNode, TOptions['anchors'][number]>>
}
export const groupGenerator: GroupGenerator = function* groupGenerator(children, value, options) {
    //if (!Array.isArray(value) && (value.type !== 'root' && value.type !== 'element')) {
    //    throw new Error("Invalid value: expected an array or a node of type 'root' or 'element'.")
    //}
    if (!(Array.isArray(value) || (typeof value == 'object' && Object.hasOwn(value, 'children') && Array.isArray(value.children)))) {
        throw new Error("Invalid value: expected an array or a node with a 'children' property.")
    }
    for (let i = 0; i < children.length;) {
        // const group: Record<TOptions['anchors'][number]['label'], GroupItem> = {} as Record<TOptions['anchors'][number]['label'], GroupItem>
        const group: GroupResult<typeof value, typeof options['anchors'][number]> = {} as GroupResult<typeof value, typeof options['anchors'][number]>
        for (const anchor of options.anchors) {
            group[anchor.label as typeof options['anchors'][number]['label']] = []
        }
        const t = i
        for (let anchorIndex = 0; i < children.length && anchorIndex < options.anchors.length; anchorIndex++) {
            const anchor = options.anchors[anchorIndex]
            let checked = anchor.check(children[i], i, children, value)
            let stat = checked.length
            while (i < children.length && stat) {
                //for (let j = 0; i < children.length && j < stat; j++) {
                //    group[anchor.label as typeof options['anchors'][number]['label']].push({
                //        contents: children[i],
                //        index: i
                //    })
                //    i++
                //}
                group[anchor.label as typeof options['anchors'][number]['label']].push({
                    contents: checked as ReturnType<typeof options['anchors'][number]['check']>,
                    index: i
                })
                i += stat
                if (i < children.length && stat) {
                    checked = anchor.check(children[i], i, children, value)
                    stat = checked.length
                }
            }
        }
        if (i === t) {
            throw new Error('Infinite loop detected in groupGenerator')
        }
        yield group
    }
}
