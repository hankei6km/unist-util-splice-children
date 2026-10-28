import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { u } from 'unist-builder'
import { is, convert } from 'unist-util-is'
import { spliceChildren } from '../../src/index.ts'
import * as folders from '../../src/utils/folders/index.ts'
import type { Literal, Node, Parent } from 'unist'

const phrasing = convert(['span', 'br', 'em', 'text'])

describe('folders.splitter', () => {
    it('should return folders', () => {
        //const isMedia = convert(['img', 'figure', 'video', 'audio'])
        const isImg = convert('img' as const)
        const isFigure = convert('figure' as const)
        const isVideo = convert('video' as const)
        const isAudio = convert('audio' as const)
        // convert(['img', 'figure', 'video', 'audio']) のようにすると型定義が想定通り通りにならない。
        const isMedia = (node: unknown) => isImg(node) || isFigure(node) || isVideo(node) || isAudio(node)
        const iUl = convert('ul' as const)
        const iOl = convert('ol' as const)
        const iDl = convert('dl' as const)
        const isList = (node: unknown) => iUl(node) || iOl(node) || iDl(node)
        const folderOpts = [{
            label: 'media' as const,
            check: ((node) => isMedia(node) ? [node] : []) as folders.Folder['check'],
            fold: false
        }, {
            label: 'list' as const,
            check: ((node) => isList(node) ? [node] : []) as folders.Folder['check'],
            fold: false
        }, {
            label: 'others' as const,
            check: ((node) => !(isMedia(node) || isList(node)) ? [node as Node] : []) as folders.Folder['check'],
            fold: true
        }]
        const callbacks = folders.getCallbacks<Parent, typeof folderOpts[number]>({
            folders: folderOpts,
        })
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
                u('img', { src: 'image1.png', alt: 'An image' }),
                u('img', { src: 'image2.png', alt: 'An image' }),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ]), u('text', { value: '* * *' }),
                u('ul', [
                    u('li', 'Item 1'),
                    u('li', 'Item 2'),
                ]),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])]
            }
            const folders = callbacks.splitter(node.children, node)
            assert.deepStrictEqual(folders, [
                {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '1'),
                    ]),
                    u('hr'),
                    u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '2'),
                    ])],
                    data: {
                        index: 0,
                        ...folderOpts[2]
                    }
                }, {
                    contents: [
                        u('img', { src: 'image1.png', alt: 'An image' })
                    ],
                    data: {
                        index: 3,
                        ...folderOpts[0]
                    }
                }, {
                    contents: [
                        u('img', { src: 'image2.png', alt: 'An image' })
                    ],
                    data: {
                        index: 4,
                        ...folderOpts[0]
                    }
                }, {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '3'),
                    ]), {
                        type: 'text', value: '* * *'
                    }],
                    data: {
                        index: 5,
                        ...folderOpts[2]
                    }
                }, {
                    contents: [u('ul', [
                        u('li', 'Item 1'),
                        u('li', 'Item 2'),
                    ])],
                    data: {
                        index: 7,
                        ...folderOpts[1]
                    }
                }, {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '3'),
                    ])],
                    data: {
                        index: 8,
                        ...folderOpts[2]
                    }
                },
            ])
        }
        {
            const node = {
                type: 'root',
                children: [
                    u('img', { src: 'image1.png', alt: 'An image' }),
                    u('img', { src: 'image2.png', alt: 'An image' }),
                    u('ul', [
                        u('li', 'Item 1'),
                        u('li', 'Item 2'),
                    ])
                ]
            }
            const folders = callbacks.splitter(node.children, node)
            assert.deepStrictEqual(folders, [
                {
                    contents: [
                        u('img', { src: 'image1.png', alt: 'An image' })
                    ],
                    data: {
                        index: 0,
                        ...folderOpts[0]
                    }
                }, {
                    contents: [
                        u('img', { src: 'image2.png', alt: 'An image' })
                    ],
                    data: {
                        index: 1,
                        ...folderOpts[0]
                    }
                }, {
                    contents: [u('ul', [
                        u('li', 'Item 1'),
                        u('li', 'Item 2'),
                    ])],
                    data: {
                        index: 2,
                        ...folderOpts[1]
                    }
                }
            ])
        }
        {
            const node = {
                type: 'root',
                children: []
            }
            const folders = callbacks.splitter(node.children, node)
            assert.deepStrictEqual(folders, [])
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
            const foldersOpts = [{
                label: 'first' as const,
                check: ((_node, index, children, _value) => index === 0 ? [children[0]] : []) as folders.Folder['check'],
                fold: false
            }, {
                label: 'last' as const,
                check: ((_node, index, children, _value) => index === children.length - 1 ? [children[children.length - 1]] : []) as folders.Folder['check'],
                fold: false
            }, {
                label: 'others' as const,
                check: ((_node, index, children, _value) => index !== 0 && index !== children.length - 1 ? [children[index]] : []) as folders.Folder['check'],
                fold: true
            }]
            const callbacks = folders.getCallbacks<typeof node, typeof foldersOpts[number]>({
                folders: foldersOpts,
            })
            const f = callbacks.splitter(node.children, node)
            assert.deepStrictEqual(f, [
                {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '1'),
                    ])],
                    data: {
                        index: 0,
                        ...foldersOpts[0]
                    }
                }, {
                    contents: [u('hr'),
                    u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '2'),
                    ]),
                    u('hr')],
                    data: {
                        index: 1,
                        ...foldersOpts[2]
                    }
                }, {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '3'),
                    ])],
                    data: {
                        index: 4,
                        ...foldersOpts[1]
                    }
                },
            ])
        }
        {
            const node = getNode()
            const foldersOpts = [{
                label: 'first' as const,
                check: ((_node, index, children, _value) => index === 0 ? [children[0]] : []) as folders.Folder['check'],
                fold: false
            }, {
                label: 'others' as const,
                check: ((_node, index, children, _value) => index !== 0 && index !== children.length - 1 ? [children[index]] : []) as folders.Folder['check'],
                fold: true
            }, {
                label: 'last' as const,
                check: ((_node, index, children, _value) => index === children.length - 1 ? [children[children.length - 1]] : []) as folders.Folder['check'],
                fold: false
            }]
            const callbacks = folders.getCallbacks<typeof node, typeof foldersOpts[number]>({
                folders: foldersOpts,
            })
            const f = callbacks.splitter(node.children, node)
            assert.deepStrictEqual(f, [
                {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '1'),
                    ])],
                    data: {
                        index: 0,
                        ...foldersOpts[0]
                    }
                }, {
                    contents: [u('hr'),
                    u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '2'),
                    ]),
                    u('hr')],
                    data: {
                        index: 1,
                        ...foldersOpts[1]
                    }
                }, {
                    contents: [u('p', [
                        u('span', 'Content:'),
                        u('br'),
                        u('em', '3'),
                    ])],
                    data: {
                        index: 4,
                        ...foldersOpts[2]
                    }
                },
            ])
        }
    })
    it('should group nodes correctly using 連続したノードによるパターン', () => {
        const getNode = () => (
            {
                type: 'root',
                children: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '1'),
                ]),
                u('p', [u('br')]),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '2'),
                ]),
                u('p', [u('br')]),
                u('p', [u('br')]),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])]
            })
        const node = getNode()
        const isParagraph = convert('p')
        const isBreak = convert('br')
        const isSingleBreak = convert((node) => isParagraph(node)
            && Array.isArray((node as any)['children'])
            && (node as any)['children'].length === 1 && isBreak((node as any)['children'][0])
        )
        const isBreaking: folders.Folder<typeof node, string, { type: 'p', children: [{ type: 'br' }] }[]>['check'] = (_node, index, children) => {
            let cnt = 0
            for (let i = index; i < children.length && isSingleBreak(children[i]); i++) {
                cnt++
            }
            if (cnt >= 2) {
                return children.slice(index, index + cnt) as { type: 'p', children: [{ type: 'br' }] }[]
            }
            return [] as { type: 'p', children: [{ type: 'br' }] }[]
        }
        const isNotBreaking: folders.Folder<typeof node, string>['check'] = (_node, index, children) => {
            if (children.length - index < 2) {
                return children.slice(index, index + (children.length - index))
            }
            const ret = []
            let i = index
            for (; i < children.length && !isSingleBreak(children[i]); i++) {
                ret.push(children[i])
            }
            for (; i < children.length && isSingleBreak(children[i]) && (i + 1 >= children.length || i + 1 < children.length && !isSingleBreak(children[i + 1])); i++) {
                ret.push(children[i])
            }
            return ret
        }
        const foldersOpts = [{
            label: 'break' as const,
            check: isBreaking,
            fold: true
        }, {
            label: 'others' as const,
            check: isNotBreaking,
            fold: true
        }]
        const callbacks = folders.getCallbacks<typeof node, typeof foldersOpts[number]>({
            folders: foldersOpts,
        })
        const f = callbacks.splitter(node.children, node)
        assert.deepStrictEqual(f, [
            {
                contents: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '1'),
                ]),
                u('p', [u('br')]),
                u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '2'),
                ]),
                ],
                data: {
                    index: 0,
                    label: 'others',
                    check: isNotBreaking,
                    fold: true
                }
            }, {
                contents: [
                    u('p', [u('br')]),
                    u('p', [u('br')])],
                data: {
                    index: 3,
                    label: 'break',
                    check: isBreaking,
                    fold: true
                }
            }, {
                contents: [u('p', [
                    u('span', 'Content:'),
                    u('br'),
                    u('em', '3'),
                ])],
                data: {
                    index: 5,
                    label: 'others',
                    check: isNotBreaking,
                    fold: true
                }
            },
        ])

    })
})

describe('Folders.splicer', () => {
    it('should splice folders correctly', () => {
        const node: Parent = {
            type: "root", children: [
                u('p', [
                    u('span', 'Line 1'),
                    u('br'),
                    u('span', 'Line 2'),
                ]),
                u("comment", " some comment "),
                u('span', 'Line 3'),
                u('p', [
                    u('span', 'Line 4'),
                ]),
                u("comment", " some comment "),
                u('p', [
                    u('span', 'Line 5'),
                ]),
            ]
        }

        const check = (node: Node) => {
            if (node.type === 'comment') {
                return true
            }
            return phrasing(node)
        }

        spliceChildren(node, {
            //...callbacks,
            ...folders.getCallbacks({
                folders: [{
                    label: 'phrasing' as const,
                    check: (node) => (check(node as Node) ? [node] : []) as ((Literal & { type: 'span' | 'em' | 'text' | 'comment' }) | { type: 'br' })[],
                    fold: true
                }, {
                    label: 'others' as const,
                    check: (node) => (!check(node as Node) ? [node] : []) as Node[],
                    fold: true
                }],
            }),
            mapper: (phrase) => {
                if (folders.select(phrase, 'phrasing') && phrase.contents.some((node) => phrasing(node))) {
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
                    u('comment', " some comment "),
                    u('span', 'Line 3'),
                ]),
                u('p', [
                    u('span', 'Line 4'),
                ]),
                u('comment', " some comment "),
                u('p', [
                    u('span', 'Line 5'),
                ]),
            ]
        }
        )
    })
})

describe('Folders.select', () => {
    it('should ', async () => {
        const node = u("root", [
            u('h1', 'Heading 1'),
            u('h2', 'Heading 2'),
            u('p', [
                u('span', 'content 1'),
            ]),
            u('p', [
                u('span', 'content 2'),
            ]),
        ])
        const isH1 = convert('h1')
        const isH2 = convert('h2')
        const isHeading = (node: unknown) => isH1(node) || isH2(node)

        const m = mock.fn<(label: 'heading' | 'others', value: string) => void>()
        spliceChildren(node, {
            //...callbacks,
            ...folders.getCallbacks({
                folders: [{
                    label: 'heading' as const,
                    check: (node) => isHeading(node) ? [node] : [],
                    fold: false
                }, {
                    label: 'others' as const,
                    check: (node,) => (!isHeading(node) ? [node] : []) as { type: 'p', children: { type: 'span', value: string }[] }[],
                    fold: true
                }],
            }),
            mapper: (item) => {
                if (folders.select(item, 'heading')) {
                    m('heading', item.contents[0].value)
                } else if (folders.select(item, 'others')) {
                    for (const node of item.contents) {
                        m('others', node.children[0].value)
                    }
                }
                return [item]
            }
        })
        assert.deepStrictEqual(m.mock.calls.map((v) => v.arguments), [
            ['heading', 'Heading 1'],
            ['heading', 'Heading 2'],
            ['others', 'content 1'],
            ['others', 'content 2'],
        ])
    })
    it('should handle item types correctly including tuples', async () => {
        const node = u("root", [
            u('h1', 'Heading 1'),
            u('h2', 'Heading 2-1'),
            u('p', [
                u('span', 'content 1'),
            ]),
            u('h2', 'Heading 2-2'),
            u('p', [
                u('span', 'content 2'),
            ]),
            u('hr'),
        ])
        const isH1 = convert('h1')
        const isH2 = convert('h2')
        const isP = convert('p')
        const isHr = convert('hr')

        const m = mock.fn<(label: 'h2' | 'p', value: string) => void>()
        spliceChildren(node, {
            //...callbacks,
            ...folders.getCallbacks({
                folders: [{
                    label: 'block' as const,
                    check: (_node, index, children) => {
                        const b = children.slice(index, index + 2)
                        if (b.length === 2 && isH2(b[0]) && isP(b[1])) {
                            return b as [{ type: 'h2', value: string }, { type: 'p', children: { type: 'span', value: string }[] }]
                        }
                        return []
                    },
                    fold: false
                }, {
                    label: 'others' as const,
                    check: (node, index, children) => {
                        const b = children.slice(index, index + 2)
                        if (b.length === 2 && isH2(b[0]) && isP(b[1])) {
                            return []
                        }
                        return [node] as Node[]
                    },
                    fold: true
                }],
            }),
            mapper: (item) => {
                if (folders.select(item, 'block')) {
                    // tuple の場合、select 後 item.contents を tuple として扱えるようになる、その確認。
                    // (ただし、 `fold: true` の場合は tuple ではなく配列として扱われる。これについては後で確認する)
                    m(item.contents[0].type, item.contents[0].value)
                    m(item.contents[1].type, item.contents[1].children[0].value)
                }
                return [item]
            }
        })
        assert.deepStrictEqual(m.mock.calls.map((v) => v.arguments), [
            ['h2', 'Heading 2-1'],
            ['p', 'content 1'],
            ['h2', 'Heading 2-2'],
            ['p', 'content 2'],
        ])
    })
    it('should ', () => {
        const tree = u("root", [
            u('text', 'text-1'),
            u('text', 'text-2'),
        ])
        const isText = convert('text')

        const m = mock.fn<(node: unknown, index: number, children: (typeof tree.children), value: typeof tree) => void>()
        spliceChildren(tree, {
            //...callbacks,
            ...folders.getCallbacks({
                folders: [{
                    label: 'text' as const,
                    check: (node, index, children, value) => {
                        m(node, index, children, value)
                        if (isText(node)) {
                            return [node] as Node[]
                        }
                        return []
                    },
                    fold: false
                }, {
                    label: 'others' as const,
                    check: (node) => isText(node) ? [] : [node] as Node[],
                    fold: true
                }],
            }),
            mapper: (item) => {
                if (folders.select(item, 'text')) {
                    item.contents[0].type === 'text' // 型が正しく推論されていることを確認するためのチェック
                }
                return [item]
            }
        })
        assert.deepStrictEqual(m.mock.calls.map((v) => v.arguments), [
            [{ type: 'text', value: 'text-1' }, 0, tree.children, tree],
            [{ type: 'text', value: 'text-2' }, 1, tree.children, tree],
        ])
    })
})

describe('Folders async', () => {
    it('should splice folders correctly', async () => {

        const node: Parent = {
            type: "root", children: [
                u('p', [
                    u('span', 'Line 1'),
                    u('br'),
                    u('span', 'Line 2'),
                ]),
                u('comment', " some comment "),
                u('span', 'Line 3'),
                u('p', [
                    u('span', 'Line 4'),
                ]),
                u('comment', " some comment "),
                u('p', [
                    u('span', 'Line 5'),
                ]),
            ]
        }

        const check = (node: Node) => {
            if (node.type === 'comment') {
                return true
            }
            return phrasing(node)
        }

        const p = spliceChildren(node, {
            ...folders.getCallbacks({
                folders: [{
                    label: 'phrasing' as const,
                    check: (node) => check(node as Node) ? [node as Node] : [],
                    fold: true
                }, {
                    label: 'others' as const,
                    check: (node) => !check(node as Node) ? [node as Node] : [],
                    fold: true
                }],
            }),
            mapper: async (phrase) => {
                if (folders.select(phrase, 'phrasing') && phrase.contents.some((node) => phrasing(node))) {
                    return [{
                        contents: [u('p', phrase.contents)],
                        data: phrase.data,
                    }]
                }
                return [phrase]
            },
            mapperReturnsPromise: true,
        })
        assert.ok(p instanceof Promise)
        await p
        assert.deepStrictEqual(node, {
            type: "root", children: [
                u('p', [
                    u('span', 'Line 1'),
                    u('br'),
                    u('span', 'Line 2'),
                ]),
                u('p', [
                    u('comment', " some comment "),
                    u('span', 'Line 3'),
                ]),
                u('p', [
                    u('span', 'Line 4'),
                ]),
                u('comment', " some comment "),
                u('p', [
                    u('span', 'Line 5'),
                ]),
            ]
        }
        )
    })
})

describe('Folders type error', () => {
    it('should report a type error when mapper return type and options are incorrect', () => {
        {
            const fn = () => {
                spliceChildren(u('div', []) as Parent, {
                    ...folders.getCallbacks({
                        folders: [{
                            label: 'span' as const,
                            check: (_node) => [_node as Node],
                            fold: true
                        }],
                    }),
                    mapper: async (item) => {
                        return [item]
                    },
                    // @ts-expect-error
                    mapperReturnsPromise: false,
                })
            }
            assert.strictEqual(typeof fn, 'function')
        }
        {
            const fn = () => {
                spliceChildren(u('div', []) as Parent, {
                    ...folders.getCallbacks({
                        folders: [{
                            label: 'span' as const,
                            check: (_node) => [_node as Node],
                            fold: true
                        }],
                    }),
                    mapper: (item) => {
                        return [item]
                    },
                    // @ts-expect-error
                    mapperReturnsPromise: true,
                })
            }
            assert.strictEqual(typeof fn, 'function')
        }
    })
    it('should report a type error when selected item type is handled incorrectly', () => {
        const isSpan = convert({ type: 'span' } as Literal & { value: string })
        const m = mock.fn()
        spliceChildren(u('root', [u('span', 'text1'), u('em', '*text*'), u('span', 'text2')]) as Parent, {
            ...folders.getCallbacks({
                folders: [{
                    label: 'span' as const,
                    check: (node) => isSpan(node) ? [node] : [],
                    fold: false
                },
                {
                    label: 'others' as const,
                    check: (node) => !isSpan(node) ? [node as Node] : [],
                    fold: true
                }],
            }),
            mapper: (item) => {
                if (folders.select(item, 'span')) {
                    assert.strictEqual(item.contents.length, 1)
                    assert.strictEqual(item.contents[0].type, 'span')
                    assert.strict.ok(item.contents[0].value.startsWith('text'))
                    // @ts-expect-error
                    item.contents[0].type === 'em' // type が異なるのでこれはエラーになるべき
                    m()
                }
                return [item]
            },
        })
        assert.strict.ok(m.mock.callCount() > 0) // 型エラーの確認としては必要ないが実際の挙動お一応確認しておく
    })
    it('should report a type error when', () => {
        const isSpan = convert({ type: 'span' } as Literal & { value: string })
        const m = mock.fn()
        spliceChildren(u('root', [u('span', 'text1'), u('em', '*text*'), u('span', 'text2')]) as Parent, {
            ...folders.getCallbacks({
                folders: [{
                    label: 'span' as const,
                    check: (node) => isSpan(node) ? [node] : [],
                    fold: false
                },
                {
                    label: 'others' as const,
                    check: (node) => !isSpan(node) ? [node as Node] : [],
                    fold: true
                }],
            }),
            mapper: (item) => {
                // @ts-expect-error
                assert.strictEqual(folders.select(item, 'foo'), false) // 存在しない label を select しようとするとエラーになるべき
                m()
                return [item]
            },
        })
        assert.strict.ok(m.mock.callCount() > 0) // 型エラーの確認としては必要ないが実際の挙動お一応確認しておく
    })
    it('should report a type error when selected item type is handled incorrectly(fold)', () => {
        type SpanEmTuple = [Literal & { type: 'span', value: string }, Literal & { type: 'em', value: string }]
        const isSpan = convert('span')
        const isEm = convert('em')
        const isSpanEmTuple = ([node1, node2]: [unknown, unknown]) => {
            if (isSpan(node1) && isEm(node2)) {
                return [node1, node2] as SpanEmTuple
            }
            return []
        }
        const m = mock.fn<(label: 'spanEm' | 'others', index: number, value: string) => void>()
        spliceChildren(u('root', [u('span', 'text1'), u('em', '*text1*'), u('span', 'text2'), u('em', '*text2*'), u('span', 'text3')]) as Parent, {
            ...folders.getCallbacks({
                folders: [{
                    label: 'spanEm' as const,
                    check: (_node, index, children) => {
                        const tuple = children.slice(index, index + 2)
                        if (tuple.length === 2 && isSpanEmTuple(tuple as [unknown, unknown])) {
                            return tuple as SpanEmTuple
                        }
                        return []
                    },
                    fold: true
                },
                {
                    label: 'others' as const,
                    check: (_node, index, children) => {
                        const tuple = children.slice(index, index + 2)
                        if (tuple.length !== 2 || !isSpanEmTuple(tuple as [unknown, unknown])) {
                            return tuple as Node[]
                        }
                        return []
                    },
                    fold: true
                }],
            }),
            mapper: (item) => {
                if (folders.select(item, 'spanEm')) {
                    for (let index = 0; index < item.contents.length; index++) {
                        const node = item.contents[index]
                        m('spanEm', index, node.value)
                    }
                    // FlatArray で type が `span | em` になっているので、これはエラーにならない
                    // (できれば `fold: true` でも tuple が配列内に展開されるようにしたいが、これは難しい)
                    item.contents[0].type === 'span'
                    item.contents[0].type === 'em'
                }
                return [item]
            },
        })
        assert.deepStrictEqual(m.mock.calls.map((v) => v.arguments), [
            ['spanEm', 0, 'text1'],
            ['spanEm', 1, '*text1*'],
            ['spanEm', 2, 'text2'],
            ['spanEm', 3, '*text2*'],
        ])
    })
})
