import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Literal } from 'unist'
import { u } from 'unist-builder'
import { convert, is } from 'unist-util-is'
import { spliceChildren } from '../../src/index.ts'
import * as segments from '../../src/utils/segments/index.ts'

describe('segments.splitter', () => {
    //const getSplitter = () => Segments.getCallbacks<ValueDefaultType, { type: 'br' }[], Segments.ItemData<{ type: 'br' }>>({
    const getSplitter = () => segments.getCallbacks({
        isDelimiter: (node): node is { type: 'br' } => is(node, { type: 'br' })
    }).splitter
    it('should return segments', () => {
        const node = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [
            {
                contents: [u('text', 'Line 1')],
                data: {
                    delimiter: [u('br')],
                    index: 0
                }
            },
            {
                contents: [u('text', 'Line 2')],
                data: {
                    delimiter: [u('br')],
                    index: 2
                }
            },
            {
                contents: [u('text', 'Line 3')],
                data: {
                    delimiter: [u('br')],
                    index: 4
                }
            },
        ])
    })
    it('should return segments(not ending with delimiter)', () => {
        const node = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
        ])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [
            {
                contents: [u('text', 'Line 1')],
                data: {
                    delimiter: [u('br')],
                    index: 0
                }
            },
            {
                contents: [u('text', 'Line 2')],
                data: {
                    delimiter: [u('br')],
                    index: 2
                }
            },
            {
                contents: [u('text', 'Line 3')],
                data: {
                    delimiter: [], // これは null の方が良いか？
                    index: 4
                }
            },
        ])
    })
    it('should return segments(consecutive delimiters)', () => {
        const node = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [
            {
                contents: [u('text', 'Line 1')],
                data: {
                    delimiter: [u('br'), u('br')],
                    index: 0
                }
            },
            {
                contents: [u('text', 'Line 3')],
                data: {
                    delimiter: [u('br')],
                    index: 3
                }
            },
        ])
    })
    it('should return segments(no delimiters)', () => {
        const node = u('root', [
            u('text', 'Line 1'),
        ])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [
            {
                contents: [u('text', 'Line 1')],
                data: {
                    delimiter: [],
                    index: 0
                }
            },
        ])
    })
    it('should return segments(only delimiter)', () => {
        const node = u('root', [
            u('br'),
        ])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [
            {
                contents: [],
                data: {
                    delimiter: [u('br')],
                    index: 0
                }
            },
        ])
    })
    it('should return segments(only consecutive delimiters)', () => {
        const node = u('root', [
            u('br'),
            u('br'),
            u('br'),
        ])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [
            {
                contents: [],
                data: {
                    delimiter: [u('br'), u('br'), u('br')],
                    index: 0
                }
            },
        ])
    })
    it('should return segments(empty node)', () => {
        const node = u('root', [])
        const segments = getSplitter()(node.children, node)
        assert.deepStrictEqual(segments, [])
    })
    it('should return segments split by consecutive delimiter nodes', () => {
        const splitter = segments.getCallbacks({
            isDelimiter: (node) => is(node, { type: 'br' }),
            minCount: 2
        }).splitter
        const node = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ])
        const s = splitter(node.children, node) // minCount: 2 を指定した splitter を使用
        assert.deepStrictEqual(s, [
            {
                contents: [u('text', 'Line 1')],
                data: {
                    delimiter: [u('br'), u('br')],
                    index: 0
                }
            },
            {
                contents: [u('text', 'Line 3'), u('br')],
                data: {
                    delimiter: [],
                    index: 3
                }
            },
        ])
    })
})

describe('Segments.splicer', () => {
    it('should splice segments correctly', () => {
        const splicer = segments.getCallbacks({
            isDelimiter: (node) => is(node, { type: 'br' })
        }).splicer
        {
            const segments = [
                {
                    contents: [u('text', 'Line 1')],
                    data: {
                        delimiter: [u('br')],
                        index: 0
                    },
                },
                {
                    contents: [u('text', 'Line 2')],
                    data: {
                        delimiter: [u('br')],
                        index: 2
                    },
                },
                {
                    contents: [u('text', 'Line 3')],
                    data: {
                        delimiter: [u('br')],
                        index: 4
                    },
                },
            ]
            const node = u('root', [
                u('text', 'Line 1'),
                u('br'),
                u('text', 'Line 2'),
                u('br'),
                u('text', 'Line 3'),
                u('br'),
            ])
            splicer(node.children, node, segments)
            assert.deepStrictEqual(node, u('root', [
                u('text', 'Line 1'),
                u('br'),
                u('text', 'Line 2'),
                u('br'),
                u('text', 'Line 3'),
                u('br'),
            ]))
        }
    })
})

describe('Segments async', () => {
    it('should splice segments correctly', async () => {
        const node = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ])
        const isDelimiter = convert({ type: "br" as const })
        const p = spliceChildren(node, {
            ...segments.getCallbacks({
                isDelimiter
            }),
            mapper: async (line, index) => {
                return [line, line] // deep copy ではないことに注意、delimiter を考慮していない(あくまでもテスト用で実際には使えない)
            },
            mapperReturnsPromise: true
        })
        assert.ok(p instanceof Promise)
        await p
        assert.deepStrictEqual(node, u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ]))
    })
})

describe('Segments type error', () => {
    it('should report a type error when mapper return type and options are incorrect', () => {
        {
            const fn = () => {
                spliceChildren(u('root', []), {
                    ...segments.getCallbacks({}),
                    mapper: async (item) => {
                        return [item]
                    },
                    // @ts-expect-error
                    mapperReturnsPromise: false,
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                spliceChildren(u('root', []), {
                    ...segments.getCallbacks({}),
                    mapper: (item) => {
                        return [item]
                    },
                    // @ts-expect-error
                    mapperReturnsPromise: true,
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
    it('should report a type error when assigning incorrect types to mapper items', () => {
        {
            const fn = () => {
                const isDelimiter = convert('br')
                spliceChildren(u('root', [
                    u('text', 'Line 1'),
                    u('br')
                ] as Literal[]), {
                    ...segments.getCallbacks({
                        isDelimiter
                    }),
                    mapper: (item) => {
                        item.contents[0] = { type: 'text', value: 'Line 1' }
                        item.data.delimiter[0] = { type: 'br' }
                        // @ts-expect-error
                        item.contents[0] = { type: 'p', children: [] } // Literal ではないノード(ここでは children を持つノード)を割り当てるとエラー
                        // @ts-expect-error
                        item.data.delimiter[0] = { type: 'span' } // isDelimiter で指定した型と異なるノードを割り当てるとエラー
                        return [item]
                    },
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
})
