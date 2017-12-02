var tokenizer = require('.')
var test = require('tape')
var fs = require('fs')

test('simple parsing', function (assert) {
  var t = tokenizer()
  t.update(Buffer.from(`(module)`))
  var ast = [Object.assign(["module"], {col: 1, line: 1})]
  assert.deepEqual(t.finish(true), ast)
  assert.end()
})

test('simple parsing', function (assert) {
  var t = tokenizer()
  t.update(Buffer.from(`(module "test")`))
  var ast = [Object.assign(["module", '"test"'], {col: 1, line: 1})]
  assert.deepEqual(t.finish(true), ast)
  assert.end()
})


test('simple parsing', function (assert) {
  var t = tokenizer()
  t.update(Buffer.from(`(module "test \\"function\\"")`))
  var ast = [Object.assign(["module", '"test \\"function\\""'], {col: 1, line: 1})]
  var code = t.finish(true)
  assert.deepEqual(code, ast)
  assert.end()
})

test('simple parsing', function (assert) {
  var t = tokenizer()
  t.update(Buffer.from(`

      (module 漢字


              "test \\"function\\""

                (nested))`))
  var ast = [
    Object.assign(["module", "漢字", '"test \\"function\\""',
      Object.assign(["nested"], {col: 17, line: 8})
    ], {col: 7, line: 3})]
  assert.deepEqual(t.finish(true), ast)
  assert.end()
})

test('stream', function (assert) {
  var t = tokenizer()
  var s = fs.createReadStream(__dirname + '/test.wat')

  s.on('data', t.update)
  s.on('error', assert.error)
  s.on('end', function () {
    console.log(require('util').inspect(t.finish(true), {depth: null, colors: true}))
    assert.end()
  })
})
