import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../dist/command.js';
import { calculateLife, reliabilityFactors } from '../dist/life.js';

const base = { C: 14, P: 2, type: 'ball' };
const cli = (...args) => {
  let stdout = '';
  let stderr = '';
  const status = runCli(args, {
    log: text => { stdout += `${text}\n`; },
    error: text => { stderr += `${text}\n`; },
  });
  return { status, stdout, stderr };
};
const required = ['--C', '14', '--P', '2', '--type', 'ball'];

test('ball example and hours conversion', () => {
  const result = calculateLife({ ...base, rpm: 1500 });
  assert.equal(result.L10, 343);
  assert.ok(Math.abs(result.hours - 3811.111111111111) < 1e-9);
});

test('roller exponent and omitted speed', () => {
  const result = calculateLife({ C: 8, P: 1, type: 'roller' });
  assert.ok(Math.abs(result.L10 - 1024) < 1e-9);
  assert.equal(Object.hasOwn(result, 'hours'), false);
});

test('all reliability factors scale life', () => {
  for (const factor of Object.values(reliabilityFactors)) {
    assert.equal(calculateLife({ ...base, a1: factor }).L10, 343 * factor);
  }
});

test('reject invalid physical inputs and unsupported types', () => {
  for (const key of ['C', 'P', 'rpm', 'a1']) {
    for (const value of [0, -1, NaN, Infinity, -Infinity]) {
      assert.throws(() => calculateLife({ ...base, [key]: value }), /greater than zero/);
    }
  }
  assert.throws(() => calculateLife({ ...base, type: 'plain' }), /type/);
  assert.throws(() => calculateLife({ ...base, C: 1e308, P: 1e-308 }), /numeric range/);
  assert.throws(() => calculateLife({ ...base, C: 1e-308, P: 1e308 }), /numeric range/);
});

test('CLI prints example with units', () => {
  const run = cli(...required, '--rpm', '1500');
  assert.equal(run.status, 0);
  assert.equal(run.stderr, '');
  assert.equal(run.stdout, 'L10: 343 Mrev\nLife: 3811.1 h\n');
});

test('JSON with hours and direct factor', () => {
  const run = cli(...required, '--rpm', '1500', '--a1', '0.64', '--json');
  assert.equal(run.status, 0);
  const result = JSON.parse(run.stdout);
  assert.equal(result.L10, 219.52);
  assert.ok(Math.abs(result.hours - 2439.111111111111) < 1e-9);
});

test('CLI reliability table and JSON without hours', () => {
  for (const [percent, factor] of Object.entries(reliabilityFactors)) {
    const run = cli(...required, '--reliability', percent, '--json');
    assert.equal(run.status, 0);
    assert.deepEqual(JSON.parse(run.stdout), { L10: 343 * factor });
  }
});

test('CLI invalid arguments exit 1 with stderr and no stdout', () => {
  const cases = [
    [], ['--C'], [...required, '--unknown'], [...required, '--rpm'],
    [...required, '--rpm', '0'], [...required, '--a1', '-1'],
    [...required, '--rpm', 'Infinity'], [...required, '--rpm', '1e999'],
    [...required, '--rpm', 'abc'], [...required, '--rpm', ' '],
    [...required, '--rpm', '0x10'], [...required, '--reliability', '94'],
    [...required, '--a1', '1', '--reliability', '90'],
    [...required, '--C', '20'], [...required, '--json', '--json'],
    ['--C', '0', '--P', '2', '--type', 'ball'],
    ['--C', '14', '--P', '-2', '--type', 'ball'],
    ['--C', '14', '--P', '2', '--type', 'plain'],
  ];
  for (const args of cases) {
    const run = cli(...args);
    assert.equal(run.status, 1, JSON.stringify(args));
    assert.match(run.stderr, /^Error: .+/);
    assert.equal(run.stdout, '');
  }
});

test('help is successful', () => {
  for (const flag of ['--help', '-h']) {
    const run = cli(flag);
    assert.equal(run.status, 0);
    assert.match(run.stdout, /Usage:/);
    assert.equal(run.stderr, '');
  }
});
