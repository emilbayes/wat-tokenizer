var tokenizer = require('.')
var test = require('tape')
var fs = require('fs')
var util = require('util')

/* Useful debugging snippet:

console.log('token', util.inspect(code, {depth: null, colors: true}))
console.log('synth', util.inspect(ast, {depth: null, colors: true}))

*/

test('empty list', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`()`))
  var ast = [l([], 1, 1)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('simple parsing', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`(module)`))
  var ast = [l([t("module", 2, 1)], 1, 1)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('whitespace', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`
    (
    module
  )`))
  var ast = [t('\n    ', 1, 1), l([t('\n    ', 6, 2), t("module", 5, 3), t('\n  ', 11, 3)], 5, 2)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('whitespace (col regression)', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`
    (`))
  var ast = [t('\n    ', 1, 1), l([], 5, 2)]
  var code = tok.final(false)
  assert.same(walk(code, ast), true)
  assert.end()
})

test('string', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`(module "test")`))
  var ast = [l([t("module", 2, 1), t(' ', 8, 1), t('"test"', 9, 1)], 1, 1)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('escaped string', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`(module "test \\"function\\"")`))
  var ast = [l([t("module", 2, 1), t(' ', 8, 1), t('"test \\"function\\""', 9, 1)], 1, 1)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('cond', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`(cond ((> x 0) x)
                                ((= x 0) 0)
                                ((< x 0) (- x)))`))
  var ast = [l([
    t('cond', 2, 1),
    t(' ', 6, 1),
    l([
      l([
        t('>', 9, 1), t(' ', 10, 1), t('x', 11, 1), t(' ', 12, 1), t('0', 13, 1)
      ], 8, 1),
      t(' ', 15, 1),
      t('x', 16, 1)
    ], 7, 1),
    t('\n                                ', 18, 1),
    l([
      l([
        t('=', 35, 2), t(' ', 36, 2), t('x', 37, 2), t(' ', 38, 2), t('0', 39, 2)
      ], 34, 2),
      t(' ', 41, 2),
      t('0', 42, 2)
    ], 33, 2),
    t('\n                                ', 44, 2),
    l([
      l([
        t('<', 35, 3), t(' ', 36, 3), t('x', 37, 3), t(' ', 38, 3), t('0', 39, 3)
      ], 34, 3),
      t(' ', 41, 3),
      l([
        t('-', 43, 3), t(' ', 44, 3), t('x', 45, 3)
      ], 42, 3),
    ], 33, 3)
  ], 1, 1)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('messy parsing', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`

      (module
;; add comment here

              "test \\"function\\""
              ;; "comment \\"
                (
                  nested
                ))`))
  var ast = [
    t('\n\n      ', 1, 1),
    l([t("module", 8, 3),
       t('\n', 14, 3),
       t(';; add comment here', 1, 4),
       t('\n\n              ', 20, 4),
       t('"test \\"function\\""', 15, 6),
       t('\n              ', 33, 6),
       t(';; "comment \\"', 15, 7),
       t('\n                ', 29, 7),
       l([
         t('\n                  ', 18, 8),
         t("nested", 19, 9),
         t('\n                ', 25, 9)
       ], 17, 8)
    ], 7, 3)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('line comment', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`(
    ;; Some comment ("ignores this")
    ;;" second comment
    "; this is a string")`))
  var ast = [
    l([
      t('\n    ', 2, 1),
      t(';; Some comment ("ignores this")', 5, 2),
      t('\n    ', 37, 2),
      t(';;" second comment', 5, 3),
      t('\n    ', 23, 3),
      t('"; this is a string"', 5, 4)
    ], 1, 1)
  ]
  var code = tok.final(false)
  assert.same(walk(code, ast), true)
  assert.end()
})

// No support for unicode yet
test.skip('unicode', function (assert) {
  var tok = tokenizer()
  tok.update(Buffer.from(`(module 漢字 hello)`))
  var ast = [
    l([t("module", 2, 1), t(' ', 7, 1), t("漢字", 8, 1), t(' ', 10, 1), t('hello', 11, 1)], 1, 1)]
  var code = tok.final()
  assert.same(walk(code, ast), true)
  assert.end()
})

test('stream', function (assert) {
  var t = tokenizer()
  var s = fs.createReadStream(__dirname + '/test.wat')

  s.on('data', t.update)
  s.on('error', assert.error)
  s.on('end', function () {
    // console.log(util.inspect(t.final(), {depth: null, colors: true}))
    assert.end()
  })
})

function l(list, col, line) {
  list.col = col
  list.line = line
  return list
}

function t(str, col, line) {
  var s = new String(str)
  s.col = col
  s.line = line
  return s
}

function equal(a, b) {
  if (a.valueOf() !== b.valueOf()) return new Error(`Values do not match for tokens\n${util.inspect(a)}\n${util.inspect(b)}\n`)
  if(a.col !== b.col) return new Error(`Columns do not match for tokens\n${util.inspect(a)}\n${util.inspect(b)}\n`)
  if(a.line !== b.line) return new Error(`Lines do not match for tokens\n${util.inspect(a)}\n${util.inspect(b)}\n`)

  return true
}

function walk (a, b) {
  var stack = [[a, b]]
  var pair
  var tEql
  while(pair = stack.pop()) {
    for (var i = 0; i < pair[0].length; i++) {
      if (Array.isArray(pair[0][i]) && Array.isArray(pair[1][i])) {
        if (pair[0][i].col !== pair[1][i].col) return new Error(`Columns do not match for lists: \n${util.inspect(a)}\n${util.inspect(b)}\n`)
        if (pair[0][i].line !== pair[1][i].line) return new Error(`Lines do not match for lists: \n${util.inspect(a)}\n${util.inspect(b)}\n`)

        stack.push([pair[0][i], pair[1][i]])
        continue
      }
      tEql = equal(pair[0][i], pair[1][i])
      if (tEql !== true) return tEql
    }
  }

  return true
}
