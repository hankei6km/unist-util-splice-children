import { afterEach, mock, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { u } from 'unist-builder'
import { spliceChildren } from '../../src/index.ts'
import * as basic from '../../src/utils/basic/index.ts'

describe('Basic', () => {
    afterEach(() => {
        mock.reset()
    })
    it('should not modify tree with default Basic callbacks', () => {
        const tree = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ])
        spliceChildren(tree, basic.getCallbacks())
        assert.deepStrictEqual(tree, u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ]))
    })
    it('should call all callbacks with correct call counts', () => {
        const tree = u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ])
        const callbacks = basic.getCallbacks<typeof tree>()
        const spySplitter = mock.fn(callbacks.splitter)
        const spyMapper = mock.fn(callbacks.mapper)
        const spySplicer = mock.fn(callbacks.splicer)
        spliceChildren(tree, {
            splitter: spySplitter,
            mapper: spyMapper,
            splicer: spySplicer,
        })
        assert.deepStrictEqual(tree, u('root', [
            u('text', 'Line 1'),
            u('br'),
            u('text', 'Line 2'),
            u('br'),
            u('text', 'Line 3'),
            u('br'),
        ]))
        assert.strictEqual(spySplitter.mock.callCount(), 1)
        assert.strictEqual(spyMapper.mock.callCount(), 6)
        assert.strictEqual(spySplicer.mock.callCount(), 1)
    })
})


//describe('Segments async', () => {
//    it('should splice segments correctly', async () => {
//        const callbacks = Segments.getCallbacks({
//            mapper: async (line, index) => {
//                return [line, line] // deep copy ではないことに注意、delimiter を考慮していない(あくまでもテスト用で実際には使えない)
//            },
//            mapperReturnsPromise: true
//        })
//        const node = h('p', [
//            h('span', 'Line 1'),
//            h('br'),
//            h('span', 'Line 2'),
//            h('br'),
//            h('span', 'Line 3'),
//            h('br'),
//        ])
//        const p = spliceChildren(node, {
//            ...callbacks
//        })
//        expect(p).toBeInstanceOf(Promise)
//        await p
//        expect(node).toEqual(h('p', [
//            h('span', 'Line 1'),
//            h('br'),
//            h('span', 'Line 1'),
//            h('br'),
//            h('span', 'Line 2'),
//            h('br'),
//            h('span', 'Line 2'),
//            h('br'),
//            h('span', 'Line 3'),
//            h('br'),
//            h('span', 'Line 3'),
//            h('br'),
//        ]))
//    })
//})
//
//describe('Segments type error', () => {
//    it('should report a type error when mapper return type and options are incorrect', () => {
//        {
//            const callbacks = Segments.getCallbacks({
//                mapper: async (item) => {
//                    return [item]
//                },
//                // @ts-expect-error
//                mapperReturnsPromise: false,
//            })
//            expect(callbacks).toBeDefined()
//        }
//        {
//            const callbacks = Segments.getCallbacks({
//                mapper: (item) => {
//                    return [item]
//                },
//                // @ts-expect-error
//                mapperReturnsPromise: true,
//            })
//            expect(callbacks).toBeDefined()
//        }
//    })
//})
//


describe('Basic(return type)', () => {
    it('should return undefined when no mapperReturnsPromise option is provided', () => {
        const fn = () => {
            const tree = {
                type: 'root',
                children: []
            }
            const p = spliceChildren(tree, {
                ...basic.getCallbacks()
            })
            // @ts-expect-error - expects undefined, not Promise
            p.then((result) => {
                assert.ok(result === undefined)
            })
        }
        assert.strictEqual(typeof fn, 'function')
    })
})
