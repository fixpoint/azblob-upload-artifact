import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { forEachConcurrently } from '../src/util';

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe('forEachConcurrently', () => {
  it('calls fn once per item with at most limit calls in flight', async () => {
    const items = Array.from({ length: 40 }, (_, i) => i);
    const seen: number[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    await forEachConcurrently(
      items,
      4,
      (i) => `item ${i}`,
      async (i) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await tick();
        seen.push(i);
        inFlight--;
      },
    );
    assert.deepEqual(
      [...seen].sort((a, b) => a - b),
      items,
    );
    assert.equal(maxInFlight, 4);
  });

  it('resolves without calling fn for no items', async () => {
    let called = false;
    await forEachConcurrently(
      [],
      4,
      (i) => `item ${i}`,
      async () => {
        called = true;
      },
    );
    assert.equal(called, false);
  });

  it('stops starting items after a failure and waits for those in flight', async () => {
    const items = Array.from({ length: 40 }, (_, i) => i);
    const started: number[] = [];
    let inFlight = 0;
    await assert.rejects(
      forEachConcurrently(
        items,
        4,
        (i) => `item ${i}`,
        async (i) => {
          started.push(i);
          inFlight++;
          await tick();
          inFlight--;
          if (i === 5) {
            throw new Error('boom 5');
          }
        },
      ),
      /^Error: item 5: boom 5$|item 5: boom 5/,
    );
    assert.equal(inFlight, 0);
    assert.ok(started.length < items.length);
  });

  it('reports every failure, not only the first', async () => {
    await assert.rejects(
      forEachConcurrently(
        [1, 2, 3],
        3,
        (i) => `item ${i}`,
        async (i) => {
          await tick();
          if (i !== 2) {
            throw new Error(`boom ${i}`);
          }
        },
      ),
      (e: Error) =>
        e.message.startsWith('2 operations failed') &&
        e.message.includes('item 1: boom 1') &&
        e.message.includes('item 3: boom 3'),
    );
  });

  it('rejects a limit that would start no worker', async () => {
    for (const limit of [0, -1, NaN, 1.5]) {
      await assert.rejects(
        forEachConcurrently(
          [1],
          limit,
          (i) => `item ${i}`,
          async () => undefined,
        ),
        /limit must be a positive integer/,
      );
    }
  });
});
