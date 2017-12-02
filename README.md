# `wat-tokenizer`

> Tokenize WebAssembly Text-format into list of lists

## Usage

```js
var watTokenizer = require('wat-tokenizer')

var tokenizer = watTokenizer()

tokenizer.parse(Buffer.from('(say (lower "hello world"))'))

var ast = tokenizer.finish(true) // [['say', ['lower', '"hello world"']]]
```

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
is not in an inconsistent state. This method may be call multiple times. Note
that due to arrays being passed by reference, any mutations to this data
structure will persist into the tokenizer, if you attempt to further update it.

## Install

```sh
npm install wat-tokenizer
```

## License

[ISC](LICENSE)
