# `wat-tokenizer`

> Tokenize WebAssembly Text-format into list of lists

## Usage

```js
var watTokenizer = require('wat-tokenizer')

var tokenizer = watTokenizer()

tokenizer.parse(Buffer.from('(say (lower "hello world"))'))

var ast = tokenizer.finish(true)
```

The above S-Expression will have the following AST:

```js
[
  [
    { [String: 'say'] col: 2, line: 1 },
    { [String: ' '] col: 5, line: 1 },
    [
      { [String: 'lower'] col: 7, line: 1 },
      { [String: ' '] col: 12, line: 1 },
      { [String: '"hello world"'] col: 13, line: 1 },
      col: 6, line: 1
    ],
    col: 1, line: 1
  ]
]
```

The syntax is tokens being [String objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) (rather than literals),
meaning they behave like strings, but have extra properties, in this case `.col`
and `.line`

## API

### `var tokenizer = watTokenizer([prealloc = 2048])`

Initialises a new tokenizer for WAT. Will naively tokenize anything that looks
like S-expressions. `prealloc` determines the size of the Buffer used to parse
each token. If you have very long strings in your source, you may wish to
increase this. Default is `2048` bytes.

### `tokenizer.update(sourceBuf)`

Update the tokenizer state with the source code contained in `Buffer`
`sourceBuf`.

### `var listOfLists = tokenizer.final([assert = false])`

Retrieve the parsed list of lists, optionally asserting that the internal state
is not in an inconsistent state. This method may be called multiple times. Note
that due to arrays being passed by reference, any mutations to this data
structure will persist into the tokenizer, if you change the returned reference.
Calling `.update` after calling `.final` is undefined behaviour.

## Install

```sh
npm install wat-tokenizer
```

## License

[ISC](LICENSE)
