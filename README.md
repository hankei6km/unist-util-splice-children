# unist-util-splice-children

`Parent` の `children` を変更する unist 用ユーティリティ。

## Install

```sh
npm install @hankei6km/unist-util-splice-children
```

## Usage

必要なコールバック関数をすべて記述する場合は下記のようになる。

ユーティリティを利用し記述を簡略化することもできる。詳細は [Utils](#utils) を参照。

```ts
import type { Root } from 'hast'
import { h } from 'hastscript'
import { toHtml } from 'hast-util-to-html'
import { convertElement } from 'hast-util-is-element'

import { spliceChildren } from '../dist/index.js'

const tree: Root = {
    type: 'root' as const,
    children: [
        h('p', 'あいうえお'),
        h('div', 'かきくけこ'),
        h('p', 'さしすせそ'),
        h('p', ['たちつてと', h('br'), 'なにぬねの'])
    ]
}

console.log(toHtml(tree))
console.log()

const isDiv = convertElement('div')
spliceChildren(tree, {
    splitter: (children) => {
        return children.map((child, index) => ({
            contents: [child],
            data: {
                index
            }
        }))
    },
    mapper: ({ contents, data }) => [{
        contents: contents.map((node) => {
            if (isDiv(node)) {
                return h('p', node.children)
            }
            return node
        }),
        data
    }],
    splicer: (children, _, items) => {
        const newChildren = []
        for (const item of items) {
            newChildren.push(...item.contents)
        }
        children.splice(0, children.length, ...newChildren)
        return void 0
    }
})

console.log(toHtml(tree))
```

yield:

```html
<p>あいうえお</p><div>かきくけこ</div><p>さしすせそ</p><p>たちつてと<br>なにぬねの</p>

<p>あいうえお</p><p>かきくけこ</p><p>さしすせそ</p><p>たちつてと<br>なにぬねの</p>
```

## API

### `spliceChildren(value, [options])`

`value` の `children` を変更する。

#### `options.splitter`

`children` を分割するための関数。

```ts
(children: ValueChildren<TNode>, value: TNode): Items<TNode, TData> | Promise<Items<TNode, TData>>
```

#### `options.splitterReturnsPromise`

`options.splitter` が `Promise` を返す場合に `true` にする。

#### `options.mapper`

`children` を変換するための関数。

```ts
(item: Item<TNode, TData>, index: number, items: Items<TNode, TData>, value: TNode): Item<TNode, TData>[] | Promise<Item<TNode, TData>[]>
```

#### `options.mapperReturnsPromise`

`options.mapper` が `Promise` を返す場合に `true` にする。

#### `options.splicer`

配列をつなぎ合わせて `children` を変更するための関数。

```ts
(children: ValueChildren<TNode>, value: TNode, items: Items<TNode, TData>): void | Promise<void>
```

#### `options.splicerReturnsPromise`

`options.splicer` が `Promise` を返す場合に `true` にする。

## `Utils`

### `utils/basic`

標準的な分割、結合のコールバックを提供するユーティリティ。

[Usage](#usage) の例は `utils/basic` を利用して簡略化できる。

```ts
import type { Root } from 'hast'
import { h } from 'hastscript'
import { toHtml } from 'hast-util-to-html'
import { convertElement } from 'hast-util-is-element'

import { spliceChildren } from '../dist/index.js'
import * as basic  from '../dist/utils/basic/index.js'

const tree: Root = {
    type: 'root' as const,
    children: [
        h('p', 'あいうえお'),
        h('div', 'かきくけこ'),
        h('p', 'さしすせそ'),
        h('p', ['たちつてと', h('br'), 'なにぬねの'])
    ]
}

console.log(toHtml(tree))
console.log()

const isDiv = convertElement('div')
spliceChildren(tree, {
    ...basic.getCallbacks(),
    mapper: ({ contents, data }) => [{
        contents: contents.map((node) => {
            if (isDiv(node)) {
                return h('p', node.children)
            }
            return node
        }),
        data
    }]

})

console.log(toHtml(tree))
```

yield:

```html
<p>あいうえお</p><div>かきくけこ</div><p>さしすせそ</p><p>たちつてと<br>なにぬねの</p>

<p>あいうえお</p><p>かきくけこ</p><p>さしすせそ</p><p>たちつてと<br>なにぬねの</p>
```

### `utils/folders`

`children`の要素にラベル付けし(設定によっては複数要素をまとめて)分割、結合するためのユーティリティ。

```ts
import type { Root, Element, Comment } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { isElement } from 'hast-util-is-element'
import { phrasing } from 'hast-util-phrasing'
import { h } from 'hastscript'

import { spliceChildren } from '../dist/index.js'
import * as folders from '../dist/utils/folders/index.js'

const tree: Root = {
    type: "root" as const,
    children: [
        h('p', [
            h('span', '行:1'),
            h('br'),
            h('span', '行:2'),
        ]),
        { type: "comment" as const, value: "ここから" },
        h('span', '行:3'),
        h('br'),
        h('span', '行:4'),
        { type: "comment" as const, value: "ここまでがパラグラフになる" },
        h('p', [
            h('span', '行:5'),
        ]),
        { type: "comment" as const, value: "コメントだけの場合はそのまま" },
        h('p', [
            h('span', '行:6'),
        ]),
        h('span', '行:7'),
        h('br'),
        h('span', '行:8'),
    ]
}

console.log(toHtml(tree))
console.log()

const isPhrasing = (node: unknown): node is Comment | Element => { // phrasing により Element よりも絞られているが今回は考慮しない
    // phrasing では comment は除外されるので、comment も含める
    if (typeof node === 'object' && node !== null && 'type' in node && node.type === 'comment') {
        return true
    }
    return isElement(node) && phrasing(node)
}

const isOthers = (node: unknown): node is Root['children'][number] => { // isPhrasing の否定により Root['children'][number] より絞られるが今回は考慮しない
    return !isPhrasing(node)
}

spliceChildren(tree, {
    ...folders.getCallbacks({
        folders: [{
            label: 'phrasing' as const,
            check: (node) => isPhrasing(node) ? [node] : [],
            fold: true
        }, {
            label: 'others' as const,
            check: (node) => isOthers(node) ? [node] : [],
            fold: true
        }],
    }),
    mapper: (item) => {
        if (folders.select(item, 'phrasing') && item.contents.some((node) => phrasing(node))) {
            return [{
                contents: [h('p', item.contents)],
                data: item.data,
            }]
        }
        return [item]
    }

})

console.log(toHtml(tree))
```

yield:

```html
<p><span>行:1</span><br><span>行:2</span></p><!--ここから--><span>行:3</span><br><span>行:4</span><!--ここまでがパラグラフになる--><p><span>行:5</span></p><!--コメントだけの場合はそのまま--><p><span>行:6</span></p><span>行:7</span><br><span>行:8</span>

<p><span>行:1</span><br><span>行:2</span></p><p><!--ここから--><span>行:3</span><br><span>行:4</span><!--ここまでがパラグラフになる--></p><p><span>行:5</span></p><!--コメントだけの場合はそのまま--><p><span>行:6</span></p><p><span>行:7</span><br><span>行:8</span></p>
```

#### `Utils.Folders.getCallbacks(options)`

##### `options.folders[]`

###### `options.folders[].label`

ラベル名。

###### `options.folders[].check`

ラベルに一致するかどうかを検査する関数。

###### `options.folders[].fold`

ラベルに一致した要素をまとめるかどうか。

#### `Utils.Folders.select(item, label)`

`mapper` 内で `item` が `label` に一致するかどうかを検査する関数。

### `utils/segments`

`children` を区切りごとに分割、結合するためのユーティリティ。

```ts
import type { Root } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { convertElement } from 'hast-util-is-element'
import { h } from 'hastscript'

import { spliceChildren } from '../dist/index.js'
import * as segments from '../dist/utils/segments/index.js'

const tree: Root = {
    type: 'root' as const,
    children: [
        h('p', ['行:1']),
        h('p', ['行:2']),
        h('p', ['行:3']),
        h('p', [h('br')]),
        h('p', ['行:4']),
        h('p', ['行:5']),
        h('p', [h('br')]),
        h('p', [h('br')]),
        h('p', ['行:6']),
        h('p', ['行:7']),
        h('p', [h('br')]),
        h('p', ['行:8']),
        h('p', ['行:9']),
    ]
}

console.log(toHtml(tree))
console.log()

const isBr = convertElement('br')
const isParagraph = convertElement('p')
const isDelimiter = ((node: unknown): node is {
    type: 'element',
    tagName: 'p',
    children: [{ type: 'element', tagName: 'br' }]
} => isParagraph(node) && node.children.length === 1 && isBr(node.children[0]))

spliceChildren(tree, {
    ...segments.getCallbacks({
        isDelimiter
    }),
    mapper: ({ contents, data }) => [{
        contents: [
            h('p', contents.flatMap((node, index, array) => {
                if (isParagraph(node)) {
                    return array.length - 1 === index ? node.children : [...node.children, h('br')]
                }
                return [node]
            }))
        ],
        data: {
            ...data,
            delimiter: []
        }
    }]

})

console.log(toHtml(tree))
```

yield:

```html
<p>行:1</p><p>行:2</p><p>行:3</p><p><br></p><p>行:4</p><p>行:5</p><p><br></p><p><br></p><p>行:6</p><p>行:7</p><p><br></p><p>行:8</p><p>行:9</p>

<p>行:1<br>行:2<br>行:3</p><p>行:4<br>行:5</p><p>行:6<br>行:7</p><p>行:8<br>行:9</p>
```

#### `utils/segments.getCallbacks(options)`

##### `options.isDelimiter`

区切りとして扱う要素を検査する関数。`hast-util-is-element` の `Check` として指定する。デフォルトは `<br>` 要素を区切りとする。

区切りは `Item` の `data.delimiter` へ保存される。

##### `options.mergeDelimiters`

連続する区切り(デフォルトは `<br>` 要素)を 1 つの `Item` にまとめるかどうか。デフォルトは `false`。

## License

MIT License

Copyright (c) 2026 hankei6km
