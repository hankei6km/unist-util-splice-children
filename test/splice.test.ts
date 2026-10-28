import { afterEach, mock, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { u } from 'unist-builder'
import type { Literal, Node, Parent } from 'unist'
import { is, convert } from 'unist-util-is'
import { getDefaultSplitter, getDefaultMapper, getDefaultSplicer, normalizedSpliceChildrenOptions } from '../src/splice.ts'
import type {
    ItemDefaultData,
    ResultMapperDefault,
    ResultSplicerDefault,
    ResultSplitterDefault,
    SpliceChildrenCallbacks,
    ValueItemContent,
} from '../src/index.ts'
import { spliceChildren } from '../src/index.ts'
import * as basic from '../src/utils/basic/index.ts'
import * as  folders from '../src/utils/folders/index.ts'
import * as segments from '../src/utils/segments/index.ts'

type _Node = (Parent & { children: Partial<Parent>[] } & { children: Partial<Literal>[] })
const phrasing = convert(['span', 'br', 'em', 'text'])

// describe('getDefaultSpliceLinesOptions', () => {
//     it('should return default options', () => {
//         const options = getDefaultSpliceLinesOptions()
// 
//         expect(options.splitter).toBeUndefined()
//         expect(options.mapper).toBeUndefined()
//         expect(options.splicer).toBeUndefined()
//     })
// })

describe('isNormalizedSpliceLinesOptions', () => {
    //function f<
    //    TNode extends ValueType,
    //    TData extends ItemDefaultData,
    //    TResultSplitter extends ResultSplitter<TNode, TData>,
    //    TResultMapper extends ResultMapper<TNode, TData>,
    //    TResultSplicer extends ResultSplicer,
    //>(value: TNode, options: SpliceChildrenOptions<
    //    TNode,
    //    TData,
    //    TResultSplitter,
    //    TResultMapper,
    //    TResultSplicer
    //>) {
    //}
    //// const opts: SpliceChildrenOptions<
    ////     ValueDefaultType,
    ////     ItemDefaultData,
    ////     Promise<ResultSplitterDefault>,
    ////     Promise<ResultMapperDefault>,
    ////     Promise<ResultSplicerDefault>
    //// > = {
    ////     mapper: async (item, index, items, value) => getDefaultMapper()(item, index, items, value),
    ////     'mapper用itemsが空だったとき常にpromiseを返す': true
    //// }
    //// f({} as unknown as Root, opts)
    //f({} as unknown as Root, {
    //    mapper: async (item, index, items, value) => getDefaultMapper()(item, index, items, value),
    //    'mapperReturnPromise': false
    //})
    it('should normalize provided options with defaults', () => {
        const { splitter, mapper, splicer } = basic.getCallbacks()
        const splitterAsync = async (children: any, value: any) => getDefaultSplitter()(children, value)
        const mapperAsync = async (item: any, index: any, items: any, value: any) => getDefaultMapper()(item, index, items, value)
        const splicerAsync = async (children: any, value: any, items: any) => getDefaultSplicer()(children, value, items)
        assert.deepStrictEqual(
            normalizedSpliceChildrenOptions({ splitter, mapper, splicer }),
            { splicer, mapper, splitter }
        )

        assert.deepStrictEqual(normalizedSpliceChildrenOptions({
            mapper, splicer,
            splitter: splitterAsync,
            splitterReturnsPromise: true
        }), {
            mapper, splicer,
            splitter: splitterAsync,
            splitterReturnsPromise: true
        })
        assert.deepStrictEqual(normalizedSpliceChildrenOptions({
            splitter, splicer,
            mapper: mapperAsync,
            mapperReturnsPromise: true
        }), {
            splitter, splicer,
            mapper: mapperAsync,
            mapperReturnsPromise: true
        })
        assert.deepStrictEqual(normalizedSpliceChildrenOptions({
            splitter, mapper,
            splicer: splicerAsync,
            splicerReturnsPromise: true
        }), {
            splitter, mapper,
            splicer: splicerAsync,
            splicerReturnsPromise: true
        })
    })
})


describe('spliceChildren', () => {
    afterEach(() => {
        mock.reset()
    })

    it('should splice children using default callbacks', () => {
        {
            const node = {
                type: "root", children: [
                    u('p', [u('text', '1')]),
                    u('p', [u('text', '2')]),
                    u('p', [u('text', '3')]),
                ]
            }
            spliceChildren(node, {
                ...basic.getCallbacks(),
            })
            assert.deepStrictEqual(node, {
                type: "root", children: [
                    u('p', [u('text', '1')]),
                    u('p', [u('text', '2')]),
                    u('p', [u('text', '3')]),
                ]
            })
        }
        {
            const node = {
                type: "root", children: [
                    u('p', [u('text', '1')]),
                    u('p', [u('text', '2')]),
                    u('p', [u('text', '3')]),
                ]
            }
            const splitter = mock.fn(getDefaultSplitter<typeof node>())
            const mapper = mock.fn(getDefaultMapper<typeof node>())
            const splicer = mock.fn(getDefaultSplicer<typeof node>())
            spliceChildren(node, {
                splitter,
                mapper,
                splicer,
            })
            assert.deepStrictEqual(node, {
                type: "root", children: [
                    u('p', [u('text', '1')]),
                    u('p', [u('text', '2')]),
                    u('p', [u('text', '3')]),
                ]
            })
            assert.strictEqual(splitter.mock.callCount(), 1)
            assert.strictEqual(mapper.mock.callCount(), 3)
            assert.strictEqual(splicer.mock.callCount(), 1)
        }
    })
    it('should splice children correctly', () => {
        {
            const node: _Node = u('p', [
                u('text', 'Word 1, Word 2, Word 3')
            ])
            spliceChildren(node, {
                splitter: (children, _value) => {
                    const t = children[0]
                    if (t.type === 'text' && typeof t.value === 'string') {
                        const words = t.value.split(',').map((word: string) => ({
                            contents: [{ type: 'text' as const, value: word.trim() }],
                            data: { index: 0 }
                        }))
                        return words
                    }
                    return []
                },
                mapper: (item, index) => {
                    return [{
                        contents: [u('span', item.contents)],
                        data: {
                            index: index + 1
                        }
                    }]
                },
                splicer: (children, _value, items) => {
                    children.splice(0, children.length, ...items.map(({ contents }) => contents).flat())
                }
            })
            assert.deepStrictEqual(node, u('p', [
                u('span', [u('text', 'Word 1')]),
                u('span', [u('text', 'Word 2')]),
                u('span', [u('text', 'Word 3')]),
            ])
            )
        }
    })

    it('should splice children correctly with utility functions', () => {
        function getCallbacks(): SpliceChildrenCallbacks<
            _Node,
            segments.ItemData<{ type: 'br' }>,
            ResultSplitterDefault<_Node, segments.ItemData<{ type: 'br' }>>,
            ResultMapperDefault<_Node, segments.ItemData<{ type: 'br' }>>,
            ResultSplicerDefault
        > {
            const isDelimiter = convert('br' as const)
            return {
                ...segments.getCallbacks({
                    isDelimiter,
                }),
                mapper: (line, index) => {
                    return [{
                        contents: [u('text', `${index + 1}`), ...line.contents],
                        data: {
                            delimiter: line.data.delimiter || [],
                            index: index + 1
                        },
                    }]
                }
            }
        }

        {
            const node: _Node = u('p', [
                u('span', 'Line 1'),
                u('br'),
                u('span', 'Line 2'),
                u('br'),
                u('span', 'Line 3'),
                u('br'),
            ])
            spliceChildren(node, {
                ...getCallbacks(),
            })
            assert.deepStrictEqual(node, u('p', [
                u('text', '1'),
                u('span', 'Line 1'),
                u('br'),
                u('text', '2'),
                u('span', 'Line 2'),
                u('br'),
                u('text', '3'),
                u('span', 'Line 3'),
                u('br'),
            ]))
        }
        {
            const node: _Node = u('p', [
                u('span', 'Line 1'),
                u('br'),
                u('span', 'Line 2'),
                u('br'),
                u('span', 'Line 3'),
            ])
            spliceChildren(node, {
                ...getCallbacks(),
            })
            assert.deepStrictEqual(node, u('p', [
                { type: 'text', value: '1' },
                u('span', 'Line 1'),
                u('br'),
                { type: 'text', value: '2' },
                u('span', 'Line 2'),
                u('br'),
                { type: 'text', value: '3' },
                u('span', 'Line 3'),
            ]))
        }
        {
            const node: _Node = u('p', [
                u('span', 'Line 1'),
                u('br'),
                u('br'),
                u('span', 'Line 2'),
                u('br'),
            ])
            spliceChildren(node, {
                ...getCallbacks(),
            })
            assert.deepStrictEqual(node, u('p', [
                { type: 'text', value: '1' },
                u('span', 'Line 1'),
                u('br'),
                u('br'),
                { type: 'text', value: '2' },
                u('span', 'Line 2'),
                u('br'),
            ]))
        }
        {
            const node: _Node = u('p', [
                u('span', 'Line 1'),
            ])
            spliceChildren(node, {
                ...getCallbacks(),
            })
            assert.deepStrictEqual(node, u('p', [
                { type: 'text', value: '1' },
                u('span', 'Line 1'),
            ]))
        }
        {
            const node: _Node = u('p', [])
            const mapper = mock.fn(() => [])
            spliceChildren(node, {
                ...getCallbacks(),
            })
            assert.deepStrictEqual(node, u('p', []))
            assert.strictEqual(mapper.mock.callCount(), 0)
        }
    })

    it('should wrap phrasing content correctly', () => {
        {

            const check = (node: _Node) => {
                if (node.type === 'comment') {
                    return true
                }
                return phrasing(node)
            }

            const node: _Node = {
                type: "root", children: [
                    u('p', [
                        u('span', 'Line 1'),
                        u('br'),
                        u('span', 'Line 2'),
                    ]),
                    u('comment', ' some comment '),
                    u('span', 'Line 3'),
                    u('p', [
                        u('span', 'Line 4'),
                    ]),
                    u('comment', ' some comment '),
                    u('p', [
                        u('span', 'Line 5'),
                    ]),
                ]
            }
            spliceChildren(node, {
                ...folders.getCallbacks({
                    folders: [{
                        label: 'phrasing' as const,
                        check: (node) => check(node as _Node) ? [node as ValueItemContent[number]] : [],
                        fold: true
                    }, {
                        label: 'others' as const,
                        check: (node) => !check(node as _Node) ? [node as ValueItemContent[number]] : [],
                        fold: true
                    }],
                }),
                mapper: (phrase) => {
                    if (phrase.data.label === 'phrasing' && phrase.contents.some((node) => phrasing(node))) {
                        return [{
                            contents: [u('p', phrase.contents)],
                            data: phrase.data,
                        }]
                    }
                    return [phrase]
                },
            })
            assert.deepStrictEqual(node, {
                type: "root", children: [
                    u('p', [
                        u('span', 'Line 1'),
                        u('br'),
                        u('span', 'Line 2'),
                    ]),
                    u('p', [
                        u('comment', ' some comment '),
                        u('span', 'Line 3'),
                    ]),
                    u('p', [
                        u('span', 'Line 4'),
                    ]),
                    u('comment', ' some comment '),
                    u('p', [
                        u('span', 'Line 5'),
                    ]),
                ]
            }
            )
        }
    })
})

describe('spliceChildren(custom data)', () => {
    interface CustomData extends ItemDefaultData {
        customLabel: string
    }

    it('should ', () => {
        const node: _Node = {
            type: "root", children: [
                u('p', [
                    u('text', 'p1')
                ]),
                u('div', [
                    u('text', 'skip')
                ]),
                u('p', [
                    u('text', 'p2'),
                    u('text', 'p3'),
                ]),
                u('p', [
                    u('text', 'p4')
                ]),
                u('p', [
                    u('text', 'p5')
                ]),
            ]
        }
        spliceChildren(node, {
            ...basic.getCallbacks<_Node, CustomData>(),
            splitter: (children, _value) => {
                const items = children.flatMap((child: _Node['children'][number], index) => {
                    if (child.type === 'p' && Object.hasOwn(child, 'children') && Array.isArray(child.children)) {
                        return child.children.map(text => {
                            return {
                                contents: [u('p', [text])],
                                data: {
                                    customLabel: `custom-${index}`,
                                    index,
                                }
                            }
                        })
                    }
                    return []
                })
                return items
            },
            mapper: (item, _index) => {
                return [{
                    contents: [u('div', [
                        u('text', item.data.customLabel),
                        ...item.contents
                    ])],
                    data: item.data
                }]
            }
        })
        assert.deepStrictEqual(node, {
            type: "root", children: [
                u('div', [
                    u('text', 'custom-0'),
                    u('p', [
                        u('text', 'p1')
                    ]),
                ]),
                u('div', [
                    u('text', 'custom-2'),
                    u('p', [
                        u('text', 'p2')
                    ]),
                ]),
                u('div', [
                    u('text', 'custom-2'),
                    u('p', [
                        u('text', 'p3')
                    ]),
                ]),
                u('div', [
                    u('text', 'custom-3'),
                    u('p', [
                        u('text', 'p4')
                    ]),
                ]),
                u('div', [
                    u('text', 'custom-4'),
                    u('p', [
                        u('text', 'p5')
                    ]),
                ]),
            ]
        })
    })
})

describe('spliceChildren(async)', () => {
    afterEach(() => {
        mock.restoreAll()
    })

    const wait = (ms: number = 10) => new Promise(resolve => setTimeout(resolve, ms))
    const getNode: () => _Node = () => u('p', [
        u('text', { value: 'Word 1, Word 2, Word 3' }),
    ])

    function getCallbacks(): SpliceChildrenCallbacks<
        _Node,
        ItemDefaultData,
        ResultSplitterDefault<_Node, ItemDefaultData>,
        ResultMapperDefault<_Node, ItemDefaultData>,
        ResultSplicerDefault
    > {
        return {
            splitter: (children, _value) => {
                const t = children[0]
                if (t.type === 'text' && typeof t.value === 'string') {
                    const words = t.value.split(',').map((word: string, index: number) => ({
                        contents: [{ type: 'text' as const, value: word.trim() }],
                        data: { index: 0 }
                    }))
                    return words
                }
                return []
            },
            mapper: (item, index) => {
                return [{
                    contents: [u('span', item.contents)],
                    data: {
                        index: index + 1
                    }
                }]
            },
            splicer: (children, _value, items) => {
                children.splice(0, children.length, ...items.map(({ contents }) => contents).flat())
            }
        }
    }
    it('should run asynchronously when all callbacks are async', async () => {
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node = getNode()
            const callbacks = getCallbacks()
            const result = spliceChildren(node, {
                splitter: async (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: async (item, index, items, value) => {
                    await wait(index === 0 ? 20 : 10) // 順番が保証されていることを確認するため 0 のとき長めに待つ
                    check('mapper')
                    return callbacks.mapper(item, index, items, value)
                },
                splicer: async (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
                splitterReturnsPromise: true,
                mapperReturnsPromise: true,
                splicerReturnsPromise: true,
            })

            assert.ok(result instanceof Promise)
            check('await')
            await result
            check('end')

            assert.strictEqual(check.mock.callCount(), 7)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter']) // splitter が return するまで非同期にならない(タイミング依存ではある)
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[4].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[5].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[6].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', [
                u('span', [u('text', 'Word 1')]),
                u('span', [u('text', 'Word 2')]),
                u('span', [u('text', 'Word 3')]),
            ]))
        }
    })
    it('should run synchronously when all callbacks are sync', async () => {
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node = getNode()
            const callbacks = getCallbacks()
            const result = spliceChildren(node, {
                splitter: (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
                splicer: (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
            })

            assert.strictEqual(result, undefined) // callbacks がすべて同期なので Promise にならない
            check('await')
            await result // これは意味がないが他のテストと統一のために実行(linter によっては警告されるかも)
            check('end')

            assert.strictEqual(check.mock.callCount(), 7)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter'])
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[4].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[5].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[6].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', [
                u('span', [u('text', 'Word 1')]),
                u('span', [u('text', 'Word 2')]),
                u('span', [u('text', 'Word 3')]),
            ]))
        }
    })
    it('should run asynchronously when only the mapper is async', async () => {
        // spliceChildren を非同期に実行するとき、mapper だけが aync であることが多いと想定される
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node = getNode()
            const callbacks = getCallbacks()
            const result = spliceChildren(node, {
                splitter: (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: async (item, index, items, value) => { await wait(); check('mapper'); return callbacks.mapper(item, index, items, value) },
                splicer: (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
                mapperReturnsPromise: true
            })

            assert.ok(result instanceof Promise)
            check('await')
            await result
            check('end')

            assert.strictEqual(check.mock.callCount(), 7)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter']) // splitter が return するまで非同期にならない(タイミング依存ではある)
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[4].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[5].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[6].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', [
                u('span', [u('text', 'Word 1')]),
                u('span', [u('text', 'Word 2')]),
                u('span', [u('text', 'Word 3')]),
            ]))
        }
    })
    it('should return correctly-typed results when mapper is applied to empty items according to options', async () => {
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node: _Node = u('p', [])
            const callbacks = {
                splitter: getDefaultSplitter<_Node>(),
                mapper: getDefaultMapper<_Node>(),
                splicer: getDefaultSplicer<_Node>(),
            }
            const result = spliceChildren(node, {
                splitter: (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: async (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
                splicer: (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
                mapperReturnsPromise: true
            })

            assert.ok(result instanceof Promise)
            check('await')
            await result
            check('end')

            assert.strictEqual(check.mock.callCount(), 4)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter'])
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', []))
        }
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node: _Node = u('p', [])
            const callbacks = {
                splitter: getDefaultSplitter<_Node>(),
                mapper: getDefaultMapper<_Node>(),
                splicer: getDefaultSplicer<_Node>(),
            }
            const result = spliceChildren(node, {
                splitter: (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
                splicer: (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
            })

            assert.strictEqual(result, undefined) // callbacks がすべて同期なので Promise にならない
            check('await')
            await result
            check('end')

            assert.strictEqual(check.mock.callCount(), 4)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter'])
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', []))
        }
    })
    it('should run asynchronously when mapperReturnsPromise: true even if mapper is synchronous', async () => {
        // ReturnsPromise オプションが true のときに mapper が同期的でも非同期的に動作することを確認するテスト
        // 各callback用オプションの 1 つでも true なら同じ処理なのでよく使いそうな mapper 用のケースのみテストする
        const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
        const node = getNode()
        const callbacks = getCallbacks()
        const result = spliceChildren(node, {
            splitter: (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
            mapper: (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
            splicer: (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
            // @ts-expect-error
            mapperReturnsPromise: true
        })

        // mapper が Promise を返さないので `mapperReturnsPromise: true` は間違いであるが、非同期的には動作する
        assert.ok(result instanceof Promise)
        check('await')
        await result
        check('end')

        assert.strictEqual(check.mock.callCount(), 7)
        assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter']) // splitter の戻り値(Promise)を待つまで非同期にならない(タイミング依存ではある)
        assert.deepStrictEqual(check.mock.calls[1].arguments, ['await'])
        assert.deepStrictEqual(check.mock.calls[2].arguments, ['mapper'])
        assert.deepStrictEqual(check.mock.calls[3].arguments, ['mapper'])
        assert.deepStrictEqual(check.mock.calls[4].arguments, ['mapper'])
        assert.deepStrictEqual(check.mock.calls[5].arguments, ['splicer'])
        assert.deepStrictEqual(check.mock.calls[6].arguments, ['end'])
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Word 1')]),
            u('span', [u('text', 'Word 2')]),
            u('span', [u('text', 'Word 3')]),
        ]))
    })
    // mapper が非期的で mapperReturnsPromise: false のときに非同期的に動作するケースは正常に動作しない。
    // 事前に防ぐことは難しい(最初の 1 要素で sniff することもできるが要素が空のときは対応できない)
    // この状態をテストするには mapper の返した Promise の解決を待てないのでリークになる。
    // 妥協点を思いつかないので一旦コメントアウトする。
    // (JavaScript で型による成約なしでコードを書いていると、このパターンにハマりそうだから対応はしたいのだが、どうしたものかね)
    // it('should ', async () => {
    //     const check = jest.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
    //     const node = getNode()
    //     const callbacks = getCallbacks()
    //     const result = spliceChildren(node, {
    //         splitter: (value) => { check('splitter'); return callbacks.splitter(value) },
    //         mapper: async (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
    //         splicer: (value, items) => { check('splicer'); return callbacks.splicer(value, items) },
    //         // @ts-expect-error
    //         mapperReturnsPromise: false
    //     })

    //     expect(result).toBeUndefined()
    //     check('await')
    //     await result
    //     check('end')

    //     expect(check).toHaveBeenCalledTimes(7)
    //     expect(check).toHaveBeenNthCalledWith(1, 'splitter')
    //     expect(check).toHaveBeenNthCalledWith(2, 'mapper')
    //     expect(check).toHaveBeenNthCalledWith(3, 'mapper')
    //     expect(check).toHaveBeenNthCalledWith(4, 'mapper')
    //     expect(check).toHaveBeenNthCalledWith(5, 'splicer')
    //     expect(check).toHaveBeenNthCalledWith(6, 'await')
    //     expect(check).toHaveBeenNthCalledWith(7, 'end')
    //     //expect(node).toEqual(h('p', [
    //     //    undefined,
    //     //    undefined,
    //     //    undefined
    //     //]))
    // })
    it('should run asynchronously when splitter or splicer is async', async () => {
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node = getNode()
            const callbacks = getCallbacks()
            const result = spliceChildren(node, {
                splitter: async (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
                splicer: (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
                splitterReturnsPromise: true
            })

            assert.ok(result instanceof Promise)
            check('await')
            await result
            check('end')

            assert.strictEqual(check.mock.callCount(), 7)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter']) // splitter の戻り値(Promise)を待つまで非同期にならない(タイミング依存ではある)
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[4].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[5].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[6].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', [
                u('span', [u('text', 'Word 1')]),
                u('span', [u('text', 'Word 2')]),
                u('span', [u('text', 'Word 3')]),
            ]))
        }
        {
            const check = mock.fn((a: 'await' | 'end' | 'splitter' | 'mapper' | 'splicer') => { })
            const node = getNode()
            const callbacks = getCallbacks()
            const result = spliceChildren(node, {
                splitter: (children, _value) => { check('splitter'); return callbacks.splitter(children, _value) },
                mapper: (item, index, items, value) => { check('mapper'); return callbacks.mapper(item, index, items, value) },
                splicer: async (children, _value, items) => { check('splicer'); return callbacks.splicer(children, _value, items) },
                splicerReturnsPromise: true
            })

            assert.ok(result instanceof Promise)
            check('await')
            await result
            check('end')

            assert.strictEqual(check.mock.callCount(), 7)
            assert.deepStrictEqual(check.mock.calls[0].arguments, ['splitter']) // splitter の戻り値(Promise)を待つまで非同期にならない(タイミング依存ではある)
            assert.deepStrictEqual(check.mock.calls[1].arguments, ['await'])
            assert.deepStrictEqual(check.mock.calls[2].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[3].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[4].arguments, ['mapper'])
            assert.deepStrictEqual(check.mock.calls[5].arguments, ['splicer'])
            assert.deepStrictEqual(check.mock.calls[6].arguments, ['end'])
            assert.deepStrictEqual(node, u('p', [
                u('span', [u('text', 'Word 1')]),
                u('span', [u('text', 'Word 2')]),
                u('span', [u('text', 'Word 3')]),
            ]))
        }
    })
})

describe('spliceChildren(flatMap)', () => {
    it('should flatMap segments when mapper returns multiple segments (sync)', () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        spliceChildren(node, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: (line, index) => {
                return [line, line] // deep copy ではないことに注意、delimiter を考慮していない(あくまでもテスト用で実際には使えない)
            }
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ]))
    })
    it('should remove segments when mapper returns empty array (sync)', () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        spliceChildren(node, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: (line, index) => {
                return (index + 1) % 2 === 0 ? [line] : []
            }
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 2')]),
            u('br'),
        ]))
    })
    it('should flatMap segments when mapper returns multiple segments (async)', async () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        await spliceChildren(node, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: async (line, index) => {
                return [line, line] // deep copy ではないことに注意、delimiter を考慮していない(あくまでもテスト用で実際には使えない)
            },
            mapperReturnsPromise: true
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ]))
    })
    it('should remove segments when mapper returns empty array (async)', async () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        await spliceChildren(node, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: async (line, index) => {
                return (index + 1) % 2 === 0 ? [line] : []
            },
            mapperReturnsPromise: true
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 2')]),
            u('br'),
        ]))
    })
})

describe('spliceChildren(children)', () => {
    it('should flatMap segments when mapper returns multiple segments (sync)', () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        spliceChildren(node.children, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: (line, index) => {
                return [line, line] // deep copy ではないことに注意、delimiter を考慮していない(あくまでもテスト用で実際には使えない)
            }
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ]))
    })
    it('should remove segments when mapper returns empty array (sync)', () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        spliceChildren(node.children, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: (line, index) => {
                return (index + 1) % 2 === 0 ? [line] : []
            }
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 2')]),
            u('br'),
        ]))
    })
    it('should flatMap segments when mapper returns multiple segments (async)', async () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        await spliceChildren(node.children, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: async (line, index) => {
                return [line, line] // deep copy ではないことに注意、delimiter を考慮していない(あくまでもテスト用で実際には使えない)
            },
            mapperReturnsPromise: true
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ]))
    })
    it('should remove segments when mapper returns empty array (async)', async () => {
        const node = u('p', [
            u('span', [u('text', 'Line 1')]),
            u('br'),
            u('span', [u('text', 'Line 2')]),
            u('br'),
            u('span', [u('text', 'Line 3')]),
            u('br'),
        ])
        const isDelimiter = convert('br' as const)
        await spliceChildren(node.children, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: async (line, index) => {
                return (index + 1) % 2 === 0 ? [line] : []
            },
            mapperReturnsPromise: true
        })
        assert.deepStrictEqual(node, u('p', [
            u('span', [u('text', 'Line 2')]),
            u('br'),
        ]))
    })
})

describe('spliceChildren(throw)', () => {
    it('should propagate thrown error from splitter to caller', () => {
        const node: _Node = {
            type: "root", children: [
                u('p'),
                u('p'),
            ]
        }
        assert.throws(() => {
            spliceChildren(node, {
                ...basic.getCallbacks({}),
                splitter: (value) => {
                    throw new Error('splitter error')
                    return []
                }
            })
        })
    }), ('splitter error')

    it('should propagate rejection from async splitter to caller', async () => {
        const node: _Node = {
            type: "root", children: [
                u('p'),
                u('p'),
            ]
        }
        const p = spliceChildren(node, {
            ...basic.getCallbacks({}),
            splitter: async (value) => {
                throw new Error('splitter error')
            },
            splitterReturnsPromise: true
        })
        await assert.rejects(p, /splitter error/)
    })
})

describe('spliceChildren(types)', () => {

    it('should not return a value of type Promise when callbacks are synchronous', () => {
        const node: _Node = {
            type: "root", children: [
                u('p'),
                u('p'),
            ]
        }
        const fn = () => {
            spliceChildren(node, {
                ...basic.getCallbacks(),
                //@ts-expect-error
            }).then(() => { })
        }
        assert.ok(fn instanceof Function)
    })
    it('should return a value of type Promise when callbacks are asynchronous', () => {
        const node: _Node = {
            type: "root", children: [
                u('p'),
                u('p'),
            ]
        }
        const fn = () => {
            spliceChildren(node, {
                ...basic.getCallbacks(),
                splitter: async (children, _value) => {
                    return []
                },
                mapper: async (item) => { return [item] },
                splicer: async (children, _value, items) => { },
                splitterReturnsPromise: true,
                mapperReturnsPromise: true,
                splicerReturnsPromise: true
            }).then(() => { })
        }
        const fnSplitter = () => {
            spliceChildren(node, {
                ...basic.getCallbacks(),
                splitter: async (children, _value) => {
                    return []
                },
                splitterReturnsPromise: true
            }).then(() => { })
        }
        const fnMapper = () => {
            spliceChildren(node, {
                ...basic.getCallbacks(),
                mapper: async (item) => { return [item] },
                mapperReturnsPromise: true
            }).then(() => { })
        }
        const fnSplicer = () => {
            spliceChildren(node, {
                ...basic.getCallbacks(),
                splicer: async (children, _value, items) => { },
                splicerReturnsPromise: true
            }).then(() => { })
        }
        assert.ok(fn instanceof Function)
        assert.ok(fnSplitter instanceof Function)
        assert.ok(fnMapper instanceof Function)
        assert.ok(fnSplicer instanceof Function)
    })
})
