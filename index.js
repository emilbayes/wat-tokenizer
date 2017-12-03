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
  var root = []
  var stack = [root]

  var insideString = false

  var line = 1
  var col = 1

  var token = Buffer.alloc(prealloc)
  var tptr = 0
  var startCol = col
  var startLine = line

  return {finish: finish, update: update}

  function finish (assert) {
    if (assert) {
      if (stack.length > 1) throw new Error('Unfinished S-expression')
      if (insideString) throw new Error('Unfinished string')
      if (tptr > 0) throw new Error('Unfinished token')
    }

    return root
  }

  function update (source) {
    for (var i = 0; i < source.length; i++, col++) {
      var node = stack[stack.length - 1]

      if (source[i] === DICT.LF) {
        line++
        col = 1
      }

      if (insideString) {
        // If not an escaped quote, append the string to the current s-expression
        // and reset "string" state, else simply append the char to the string
        if (source[i] === DICT.QUOTE && source[i - 1] !== DICT.ESCAPE) {
          token[tptr++] = source[i] // include the final quote
          var t = new String(token.slice(0, tptr).toString())
          t.col = startCol
          t.line = startLine
          node.push(t)
          tptr = 0
          insideString = false
        } else {
          if (tptr === 0) {
            startCol = col
            startLine = line
          }
          token[tptr++] = source[i]
        }
        // This continue will skip the switch
        continue
      }

      switch(source[i]) {
        case DICT.QUOTE:
          insideString = true
          token[tptr++] = source[i] // include the initial quote
          break

        case DICT.LIST_START:
          var elm = []
          elm.col = col
          elm.line = line

          node.push(elm)
          stack.push(elm)

          break

        case DICT.LIST_END:
          if (tptr !== 0) {
            var t = new String(token.slice(0, tptr).toString())
            t.col = startCol
            t.line = startLine
            node.push(t)
            tptr = 0
          }

          stack.pop()
          break

        case DICT.LF:
        case DICT.TAB:
        case DICT.SPACE:
          if (tptr !== 0) {
            var t = new String(token.slice(0, tptr).toString())
            t.col = startCol
            t.line = startLine
            node.push(t)
            tptr = 0
          }
          break

        default:
          token[tptr++] = source[i]
          break
      }
    }
  }
}
