var assert = require('nanoassert')

var DICT = {
  LIST_START: 40,
  LIST_END: 41,
  QUOTE: 34,
  ESCAPE: 92,
  LF: 10,
  TAB: 9,
  SPACE: 32
}

module.exports = function tokenizer (prealloc) {
  if (prealloc == null) prealloc = 2048

  assert(typeof prealloc === 'number', 'prealloc must be Number')
  assert(prealloc >= 128, 'prealloc must be at least 128')
  assert(Number.isSafeInteger(prealloc), 'prealloc must be safe integer')

  // File root. A program can have multiple root S-Expressions
  var root = []
  // Our passing stack. Exploiting the fact that arrays are passed by reference
  var stack = [root]

  // Node reference as we always will be working with the last element in the
  // stack, and pop successively as we close S-Expressions. Again, reference
  // because array
  var node = stack[stack.length - 1]

  // State variables
  var insideString = false
  var insideWhitespace = false

  // Source positions. Added to each token and list
  var line = 1
  var col = 1
  // Updated each time we encounter a new elm. Required since we create a new
  // string object at the bondary between each token
  var startLine = line
  var startCol = col

  // Buffer to contain the current token
  var token = Buffer.alloc(prealloc)
  // Counter used to slice the token buffer to the number of bytes written
  var tptr = 0

  var self = {final: final, update: update}

  return self

  function final (assert) {
    // Flush any trailing whitespace
    if (insideWhitespace) addtoken()

    if (assert !== false) {
      if (stack.length > 1) throw new Error('Unfinished S-expression, col: ' + startCol + ', line: ' + startLine)
      var str = token.slice(0, tptr).toString().replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\0/g, '\\u{0000}')
      if (insideString) throw new Error('Unfinished string: `' + str + '`, col: ' + startCol + ', line: ' + startLine)
      if (tptr > 0) throw new Error('Unfinished token: `' + str + '`, col: ' + startCol + ', line: ' + startLine)
    }

    return root
  }

  function update (source) {
    assert(Buffer.isBuffer(source), 'source must be Buffer')

    parseloop: for (var i = 0; i < source.length; i++, col++) {
      switch(source[i]) {
        case DICT.LF:
        case DICT.TAB:
        case DICT.SPACE:
          if (!insideWhitespace && !insideString) {
            addtoken()
            insideWhitespace = true
          }

          if (source[i] === DICT.LF) {
            line++
            col = 0
          }

          break
        case DICT.QUOTE:
          if (!insideString) {
            addtoken()
            insideString = true
            token[tptr++] = source[i] // include the initial quote
            continue parseloop
          }

          if (insideString && token[tptr - 1] !== DICT.ESCAPE) {
            token[tptr++] = source[i] // include the final quote
            addtoken()
            continue parseloop
          }
          break

        case DICT.LIST_START:
          if (!insideString) {
            addtoken()
            pushlist()
            continue parseloop
          }
          break

        case DICT.LIST_END:
          if (!insideString) {
            addtoken()
            poplist()
            continue parseloop
          }
          break

        default:
          if (!insideString && insideWhitespace) {
            addtoken()
          }

          break
      }

      // Always append token unless continue from above statements
      token[tptr++] = source[i]
    }

    return self
  }

  function pushlist () {
    var elm = []
    elm.col = startCol
    elm.line = startLine

    startCol = col + 1
    startLine = line

    stack.push(elm)
    node.push(elm)
    node = elm
  }

  function poplist () {
    stack.pop()

    startCol = col + 1
    startLine = line

    node = stack[stack.length - 1]
  }

  function addtoken () {
    // guard against empty tokens
    if (tptr === 0) return

    var t = new String(token.slice(0, tptr).toString())
    t.col = startCol
    t.line = startLine
    node.push(t)
    tptr = 0

    startCol = col
    startLine = line

    insideString = false
    insideWhitespace = false
  }
}
