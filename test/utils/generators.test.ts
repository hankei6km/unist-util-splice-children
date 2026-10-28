import { afterEach, mock, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { u } from 'unist-builder'
import type { Node, Parent } from 'unist'
import { convert, is } from 'unist-util-is'
import type { GroupAnchor, GroupItem } from '../../src/utils/generators.ts'
import { groupGenerator } from '../../src/utils/generators.ts'

const phrasing = convert(['span', 'br', 'em', 'text'])
const isPhrasing = (node: unknown): node is ({ type: 'span' } | { type: 'br' } | { type: 'em' } | { type: 'text' }) => phrasing(node)

describe('groupGenerator', () => {
    afterEach(() => {
        mock.reset()
    })
    it('should return groups', () => {
        {
            const node = {
                type: 'root',
                children: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '1'),
                ]),
                u('hr'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '2'),
                ]),
                u('hr'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])]
            }
            const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
            for (const group of groupGenerator(node.children, node, {
                anchors: [{
                    label: 'all',
                    check: (n) => [n as typeof node['children'][number]]
                }]
            })) {
                groups(group)
            }
            assert.strictEqual(groups.mock.callCount(), 1)
            assert.deepStrictEqual(groups.mock.calls[0].arguments[0], {
                all: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '1'),
                        ])],
                        index: 0
                    },
                    {
                        contents: [u('hr')],
                        index: 1
                    },
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '2'),
                        ])],
                        index: 2
                    },
                    {
                        contents: [u('hr')],
                        index: 3
                    },
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '3'),
                        ])],
                        index: 4
                    },
                ]
            })
        }
        {
            const node = {
                type: 'root',
                children: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '1'),
                ]),
                u('hr'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '2'),
                ]),
                u('hr'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])] as (Parent | Node)[]
            }
            const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
            for (const group of groupGenerator(node.children, node, {
                anchors: [
                    { label: 'nonPhrasingItems', check: (value) => !isPhrasing(value) ? [value as typeof node['children'][number]] : [] },
                    { label: 'phrasingItems', check: (value) => isPhrasing(value) ? [value] : [] }
                ]
            })) {
                groups(group)
            }
            assert.strictEqual(groups.mock.callCount(), 1)
            assert.deepStrictEqual(groups.mock.calls[0].arguments[0], {
                nonPhrasingItems: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '1'),
                        ])],
                        index: 0
                    },
                    { contents: [u('hr')], index: 1 },
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '2'),
                        ])],
                        index: 2
                    },
                    { contents: [u('hr')], index: 3 },
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '3'),
                        ])],
                        index: 4
                    }
                ],
                phrasingItems: [
                ]
            })
        }
        {
            const node = {
                type: 'root',
                children: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '1'),
                ]),
                u('text', '* * *'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '2'),
                ]),
                u('text', '* * *'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])]
            }
            const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
            for (const group of groupGenerator(node.children, node, {
                anchors: [
                    { label: 'nonPhrasingItems', check: (value) => !isPhrasing(value) ? [value as typeof node['children'][number]] : [] },
                    { label: 'phrasingItems', check: (value) => isPhrasing(value) ? [value] : [] }
                ]
            })) {
                groups(group)
            }
            assert.strictEqual(groups.mock.callCount(), 3)
            assert.deepStrictEqual(groups.mock.calls[0].arguments[0], {
                nonPhrasingItems: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '1'),
                        ])],
                        index: 0
                    },
                ],
                phrasingItems: [
                    {
                        contents: [{ type: 'text', value: '* * *' }],
                        index: 1
                    }
                ]
            })
            assert.deepStrictEqual(groups.mock.calls[1].arguments[0], {
                nonPhrasingItems: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '2'),
                        ])],
                        index: 2
                    },
                ],
                phrasingItems: [
                    {
                        contents: [{ type: 'text', value: '* * *' }],
                        index: 3
                    }
                ]
            })
            assert.deepStrictEqual(groups.mock.calls[2].arguments[0], {
                nonPhrasingItems: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '3'),
                        ])],
                        index: 4
                    }
                ],
                phrasingItems: [
                ]
            })
        }
        {
            const node = {
                type: 'root',
                children: [
                    u('text', '* * *'),
                    u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '1'),
                    ]),
                    u('text', '* * *'),
                    u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '2'),
                    ]),
                    u('text', '* * *'),
                ] as (Parent | Node)[]
            }
            const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
            for (const group of groupGenerator(node.children, node, {
                anchors: [
                    { label: 'nonPhrasingItems', check: (value) => !isPhrasing(value) ? [value as typeof node['children'][number]] : [] },
                    { label: 'phrasingItems', check: (value) => isPhrasing(value) ? [value] : [] }
                ]
            })) {
                groups(group)
            }
            assert.strictEqual(groups.mock.callCount(), 3)
            assert.deepStrictEqual(groups.mock.calls[0].arguments[0], {
                nonPhrasingItems: [
                ],
                phrasingItems: [
                    {
                        contents: [{ type: 'text', value: '* * *' }],
                        index: 0
                    }
                ]
            })
            assert.deepStrictEqual(groups.mock.calls[1].arguments[0], {
                nonPhrasingItems: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '1'),
                        ])],
                        index: 1
                    }
                ],
                phrasingItems: [
                    {
                        contents: [{ type: 'text', value: '* * *' }],
                        index: 2
                    }
                ]
            })
            assert.deepStrictEqual(groups.mock.calls[2].arguments[0], {
                nonPhrasingItems: [
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '2'),
                        ])],
                        index: 3
                    }
                ],
                phrasingItems: [
                    {
                        contents: [{ type: 'text', value: '* * *' }],
                        index: 4
                    }
                ],
            })
        }
    })
    it('should return groups correctly(multiple breaks)', () => {
        const node = u('p', [
            u('span', 'line 1'),
            u('span', 'line 2'),
            u('br'),
            u('span', 'line 3'),
            u('br'),
            u('br'),
            u('span', 'line 4'),
            u('br'),
            u('span', 'line 5'),
            u('span', 'line 6'),
            u('br'),
            u('br'),
            u('br'),
            u('span', 'line 7'),
            u('br'),
            u('br'),
        ])
        const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
        const isBreak = convert(['br'])
        const isBreaking: GroupAnchor<typeof node, string>['check'] = (_value, index, children) => {
            const ret = []
            for (let i = index; isBreak(children[i]) && i < children.length; i++) {
                ret.push(children[i] as typeof node['children'][number])
            }
            if (ret.length > 1) {
                return ret
            }
            return []
        }
        const isNotBreaking: GroupAnchor<typeof node, string>['check'] = (_value, index, children) => {
            const ret = []
            for (let i = index; i < children.length; i++) {
                if (!isBreak(children[i]) || i + 1 >= children.length || !isBreak(children[i + 1])) {
                    ret.push(children[i] as typeof node['children'][number])
                } else {
                    break
                }
            }
            return ret
        }
        for (const group of groupGenerator(node.children, node, {
            anchors: [
                { label: 'break', check: isBreaking },
                { label: 'other', check: isNotBreaking } // 単純な反転だと無駄計計算(比較)が増える
            ]
        })) {
            groups(group)
        }
        assert.strictEqual(groups.mock.callCount(), 4)
        assert.deepStrictEqual(groups.mock.calls[0].arguments[0], {
            break: [
            ],
            other: [
                {
                    contents: [
                        u('span', 'line 1'),
                        u('span', 'line 2'),
                        u('br'),
                        u('span', 'line 3')
                    ],
                    index: 0
                }
            ]
        })
        assert.deepStrictEqual(groups.mock.calls[1].arguments[0], {
            break: [
                {
                    contents: [
                        u('br'),
                        u('br')
                    ],
                    index: 4
                }
            ],
            other: [
                {
                    contents: [
                        u('span', 'line 4'),
                        u('br'),
                        u('span', 'line 5'),
                        u('span', 'line 6')
                    ],
                    index: 6
                }
            ]
        })
        assert.deepStrictEqual(groups.mock.calls[2].arguments[0], {
            break: [
                {
                    contents: [
                        u('br'),
                        u('br'),
                        u('br')
                    ],
                    index: 10
                },
            ],
            other: [
                {
                    contents: [u('span', 'line 7')],
                    index: 13
                },
            ]
        })
        assert.deepStrictEqual(groups.mock.calls[3].arguments[0], {
            break: [
                {
                    contents: [
                        u('br'),
                        u('br')
                    ],
                    index: 14
                },
            ],
            other: []
        })
    })
    it('should throw an error for empty anchors', () => {
        {
            const node = {
                type: 'root',
                children: [
                    u('p', [
                        u('span', 'Content: 1'),
                    ]),
                    u('p', [
                        u('span', 'Content: 2'),
                    ]),
                    u('p', [
                        u('span', 'Content: 3'),
                    ]),
                    u('p', [
                        u('span', 'Content: 4'),
                    ]),
                ]
            }
            const iterator = groupGenerator(node.children, node, { anchors: [] })
            assert.throws(() => { iterator.next() }, /Infinite loop detected in groupGenerator/)
        }
    })
    it('should group nodes correctly using index and children of <root>', () => {
        const getNode = () => (
            {
                type: 'root',
                children: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '1'),
                ]),
                u('hr'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '2'),
                ]),
                u('hr'),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])]
            })
        {
            const node = getNode()
            const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
            for (const group of groupGenerator(node.children, node, {
                anchors: [
                    { label: 'first', check: (n, index) => index === 0 ? [n] as (typeof node['children'][number])[] : [] },
                    { label: 'last', check: (n, index, children) => index === children.length - 1 ? [n] as (typeof node['children'][number])[] : [] },
                    { label: 'others', check: (n, index, children) => index !== 0 && index !== children.length - 1 ? [n] as (typeof node['children'][number])[] : [] }
                ]
            })) {
                groups(group)
            }
            assert.strictEqual(groups.mock.calls.length, 2)
            assert.deepStrictEqual(groups.mock.calls[0].arguments[0],
                {
                    first: [{
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '1'),
                        ])],
                        index: 0
                    }],
                    last: [],
                    others: [{
                        contents: [u('hr')],
                        index: 1
                    },
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '2'),
                        ])],
                        index: 2
                    },
                    {
                        contents: [u('hr')],
                        index: 3
                    }]
                })
            assert.deepStrictEqual(groups.mock.calls[1].arguments[0],
                {
                    first: [],
                    last: [{
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '3'),
                        ])],
                        index: 4
                    }],
                    others: []
                })
        }
        {
            const node = getNode()
            const groups = mock.fn<(_g: Record<string, GroupItem>) => void>()
            // group の定義と chhildren の配置によって一時的に作成される配列のサイズに偏りがでる。
            // 単純に振り分けるだけの generetor も作成するか？その場合、generetor を外部に API として公開する必要がある、かな。
            for (const group of groupGenerator(node.children, node, {
                anchors: [
                    { label: 'first', check: (n, index) => index === 0 ? [n] as (typeof node['children'][number])[] : [] },
                    { label: 'others', check: (n, index, children) => index !== 0 && index !== children.length - 1 ? [n] as (typeof node['children'][number])[] : [] },
                    { label: 'last', check: (n, index, children) => index === children.length - 1 ? [n] as (typeof node['children'][number])[] : [] }
                ]
            })) {
                groups(group)
            }
            assert.strictEqual(groups.mock.callCount(), 1)
            assert.deepStrictEqual(groups.mock.calls[0].arguments[0],
                {
                    first: [{
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '1'),
                        ])],
                        index: 0
                    }],
                    others: [{
                        contents: [u('hr')],
                        index: 1
                    },
                    {
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '2'),
                        ])],
                        index: 2
                    },
                    {
                        contents: [u('hr')],
                        index: 3
                    }],
                    last: [{
                        contents: [u('p', [
                            u('span', 'Content:'),
                            u('br'),
                            u('em', '3'),
                        ])],
                        index: 4
                    }]
                })
        }
    })
})
