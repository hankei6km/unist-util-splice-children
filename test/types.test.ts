import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spliceChildren } from '../src/index.ts'
import * as basic from '../src/utils/basic/index.ts'

describe('ReturnsPromise(not errors)', () => {
    it('should transpile successfully when splitter return type and options are correct', async () => {
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks({
                    }),
                    splitter: (_value) => []
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splitter: (_value) => [],
                    splitterReturnsPromise: false
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }

                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splitter: (_value) => Promise.resolve([]),
                    splitterReturnsPromise: true
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
    it('should transpile successfully when mapper return type and options are correct', async () => {
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks({
                    }),
                    mapper: (item, _index, _items, _value) => [item]
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    mapper: (item, _index, _items, _value) => [item],
                    mapperReturnsPromise: false
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }

                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    mapper: (item, _index, _items, _value) => Promise.resolve([item]),
                    mapperReturnsPromise: true
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
    it('should transpile successfully when splicer return type and options are correct', async () => {
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks({
                    }),
                    splicer: (_value, _items) => void 0
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splicer: (_value, _items) => void 0,
                    splicerReturnsPromise: false
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }

                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splicer: (_value, _items) => Promise.resolve(),
                    splicerReturnsPromise: true
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
    it('should accept false when callbacks are not specified', async () => {
        const fn = () => {
            const node = {
                type: 'root',
                children: []
            }

            spliceChildren(node, {
                ...basic.getCallbacks(),
                splitterReturnsPromise: false,
                mapperReturnsPromise: false,
                splicerReturnsPromise: false
            })
        }
        assert.ok(fn instanceof Function)
    })
    it('should not accept true when callbacks are not specified', async () => {
        const fn = () => {
            const node = {
                type: 'root',
                children: []
            }

            spliceChildren(node, {
                ...basic.getCallbacks(),
                // @ts-expect-error
                splitterReturnsPromise: true,
                // @ts-expect-error
                mapperReturnsPromise: true,
                // @ts-expect-error
                splicerReturnsPromise: true
            })
        }
        assert.ok(fn instanceof Function)
    })
})
describe('ReturnsPromise(errors)', () => {
    it('should report a type error when splitter return type and options are incorrect', async () => {
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks({
                    }),
                    splitter: (_value) => [],
                    // @ts-expect-error
                    splitterReturnsPromise: true
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                // @ts-expect-error
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splitter: async (_value) => [],
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splitter: (_value) => Promise.resolve([]),
                    // @ts-expect-error
                    splitterReturnsPromise: false
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
    it('should report a type error when mapper return type and options are incorrect', async () => {
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    mapper: (item, _index, _items, _value) => [item],
                    // @ts-expect-error
                    mapperReturnsPromise: true
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                // @ts-expect-error
                spliceChildren(node, {
                    mapper: async (item, _index, _items, _value) => [item],
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    mapper: (item, _index, _items, _value) => Promise.resolve([item]),
                    // @ts-expect-error
                    mapperReturnsPromise: false
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
    it('should report a type error when splicer return type and options are incorrect', async () => {
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks({
                    }),
                    splicer: (_value, _items) => void 0,
                    // @ts-expect-error
                    splicerReturnsPromise: true
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                // @ts-expect-error
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splicer: async (_value, _items) => void 0,
                })
            }
            assert.ok(fn instanceof Function)
        }
        {
            const fn = () => {
                const node = {
                    type: 'root',
                    children: []
                }
                spliceChildren(node, {
                    ...basic.getCallbacks(),
                    splicer: (_value, _items) => Promise.resolve(),
                    // @ts-expect-error
                    splicerReturnsPromise: false
                })
            }
            assert.ok(fn instanceof Function)
        }
    })
})
