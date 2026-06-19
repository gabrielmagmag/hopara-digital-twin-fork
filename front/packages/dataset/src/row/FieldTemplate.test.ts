import {resolveTemplate} from './FieldTemplate'

test('resolves simple variables in a template string', () => {
  const resolved = resolveTemplate('${var1}-${var2}', {var1: 'alpha', var2: 'beta'})
  expect(resolved).toEqual('alpha-beta')
})

test('resolves variables using case-insensitive keys', () => {
  const resolved = resolveTemplate('${var1}-${var2}', {VaR1: 'alpha', VAR2: 'beta'})
  expect(resolved).toEqual('alpha-beta')
})

test('resolves bracket variables and nested values', () => {
  const resolved = resolveTemplate('asset:${device.id}', {device: {id: 42}})
  expect(resolved).toEqual('asset:42')
})

test('replaces unresolved variables with empty string', () => {
  const resolved = resolveTemplate('${var1}-${missing}', {var1: 'alpha'})
  expect(resolved).toEqual('alpha-')
})

test('keeps non-braced variables unchanged', () => {
  const resolved = resolveTemplate('$var1-${var2}', {var1: 'alpha', var2: 'beta'})
  expect(resolved).toEqual('$var1-beta')
})
