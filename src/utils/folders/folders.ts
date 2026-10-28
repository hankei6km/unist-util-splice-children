import type {
    ItemDefaultData,
    Items,
    ValueType,
    SpliceChildrenCallbacks,
    SpliceChildrenCallbacksOptions,
    ValueChildren,
    ResultSplitterDefault,
    ResultMapperDefault,
    ResultSplicerDefault,
    Item,
    ResultMapper,
    ResultSplitterSync,
    ResultSplicerSync,
    ValueItemContent,
    ValueDefaultType
} from '../../types.ts'
import type { GroupAnchor } from '../generators.ts'
import { groupGenerator } from '../generators.ts'

export type Folder<TNode extends ValueType = ValueDefaultType, TLabel extends string = string, TItemContent extends ValueItemContent = ValueItemContent> = {
    label: TLabel,
    check: GroupAnchor<TNode, TLabel, TItemContent>['check'],
    fold: boolean
}
export type ItemData<TNode extends ValueType = ValueDefaultType, TFolder extends Folder<TNode> = Folder<TNode>> = ItemDefaultData & TFolder
export interface FoldersOptions<
    TNode extends ValueType,
    TFolder extends Folder<TNode>,
    TResultSplitter extends ResultSplitterSync<TNode, ItemData<TNode, TFolder>> = ResultSplitterDefault<TNode, ItemData<TNode, TFolder>>,
    TResultMapper extends ResultMapper<TNode, ItemData<TNode, TFolder>> = ResultMapperDefault<TNode, ItemData<TNode, TFolder>>,
    TResultSplicer extends ResultSplicerSync = ResultSplicerDefault,
> {
    folders: TFolder[]
}
export function select<
    TItemData extends { label: string, check: (...args: any[]) => any[], fold: boolean }, //ItemData を使うと check で children 以降の引数あるとエラー、また TNode を決定しにくい。
    TLabel extends TItemData['label'] = TItemData['label']
>(item: { data: TItemData }, label: TLabel)
    : item is Extract<TItemData, { label: TLabel }>['fold'] extends true ?
    Item<
        FlatArray<ReturnType<Extract<TItemData, { label: TLabel }>['check']>[], 1>[], // flatMap で連続する contents をまとめている(これで tuple が配列になってしまう)
        ItemDefaultData & Extract<TItemData, { label: TLabel }>
    > : Item<
        ReturnType<Extract<TItemData, { label: TLabel }>['check']>,
        ItemDefaultData & Extract<TItemData, { label: TLabel }>
    > {
    return item.data.label === label
}
export function getCallbacks<
    //TNode extends ValueType = ValueDefaultType,
    //TLabel extends string = string,
    //TData extends ItemData<TLabel> = ItemData<TLabel>,
    //TResultSplitter extends Items<TNode, TData> | Promise<Items<TNode, TData>> = Items<TNode, TData>,
    //TResultMapper extends Items<TNode, TData> | Promise<Items<TNode, TData>> = Items<TNode, TData>,
    //TResultSplicer extends void | Promise<void> = void
    TNode extends ValueType,
    TFolder extends Folder<TNode> = Folder<TNode>,
    TResultSplitter extends ResultSplitterSync<TNode, ItemData<TNode, TFolder>> = ResultSplitterDefault<TNode, ItemData<TNode, TFolder>>,
    TResultMapper extends ResultMapper<TNode, ItemData<TNode, TFolder>> = ResultMapperDefault<TNode, ItemData<TNode, TFolder>>, // mapper は外部からら渡されるので同期か非同期は確定していない.
    TResultSplicer extends ResultSplicerSync = ResultSplicerDefault,
>(
    options: FoldersOptions<TNode, TFolder, TResultSplitter, TResultMapper, TResultSplicer>
): Omit<SpliceChildrenCallbacks<TNode, ItemData<TNode, TFolder>, TResultSplitter, TResultMapper, TResultSplicer>, 'mapper'> &
    Omit<SpliceChildrenCallbacksOptions<TNode, ItemData<TNode, TFolder>, TResultSplitter, TResultMapper, TResultSplicer>, 'mapperReturnsPromise'> {
    return {
        splitter: (children, value: TNode) => {
            let folders: Items<ValueChildren<TNode>, ItemData<TNode, TFolder>> = []
            const anchors: GroupAnchor<TNode, typeof options['folders'][number]['label']>[] = options.folders.map(folder => ({
                label: folder.label,
                check: folder.check
            }))
            for (const group of groupGenerator(children, value, { anchors })) {
                for (const folder of options.folders) {
                    const folderItems = group[folder.label as typeof options['folders'][number]['label']] || []
                    if (folderItems.length > 0) {
                        if (folder.fold) {
                            folders = folders.concat({
                                contents: folderItems.flatMap((item) => item.contents),
                                data: {
                                    index: folderItems[0].index,
                                    ...folder
                                }
                            } as Item<ValueChildren<TNode>, ItemData<TNode, TFolder>>)
                        } else {
                            const folderContentData = folderItems.map((content) => ({
                                contents: content.contents,
                                data: {
                                    index: content.index,
                                    ...folder,
                                    fold: false
                                } as ItemData<TNode, TFolder>
                            } as Item<ValueChildren<TNode>, ItemData<TNode, TFolder>>))
                            folders = folders.concat(folderContentData)
                        }
                    }
                }
            }
            return folders as TResultSplitter
        },
        splicer: (children, value: TNode, items: Items<ValueChildren<TNode>, ItemData<TNode, TFolder>>) => {
            const newChildren = []
            for (const item of items) {
                newChildren.push(...item.contents)
            }
            children.splice(0, children.length, ...newChildren)
            return void 0 as TResultSplicer
        }

    }

}
