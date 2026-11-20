import { describe, it } from 'mocha';
import { expect } from 'chai';
import { progressValues, updateProgress } from './progress';
import type { SessionInfo } from './types';

const T = 10_000_000;

/**
 * Session with one playing item.
 *
 * @param pos - position in seconds
 * @param paused - paused
 * @param item - item id
 */
function session(pos: number, paused = false, item = 'a1'): SessionInfo {
    return {
        Id: 's1',
        DeviceId: 'd1',
        NowPlayingItem: { Id: item, Name: 'Song', Type: 'Audio', RunTimeTicks: 200 * T },
        PlayState: { PositionTicks: pos * T, IsPaused: paused },
    };
}

describe('progress', () => {
    it('counts on between two reports while playing', () => {
        const p = updateProgress(undefined, session(10), 0)!;
        expect(progressValues(p, 0)['media.elapsed']).to.equal(10);
        expect(progressValues(p, 5_000)['media.elapsed']).to.equal(15);
        expect(progressValues(p, 5_000)['media.seek']).to.equal(7.5);
    });

    it('keeps counting when the server repeats the same position', () => {
        const p1 = updateProgress(undefined, session(10), 0)!;
        const p2 = updateProgress(p1, session(10), 5_000)!;
        expect(progressValues(p2, 6_000)['media.elapsed']).to.equal(16);
    });

    it('takes a new reported position as base', () => {
        const p1 = updateProgress(undefined, session(10), 0)!;
        const p2 = updateProgress(p1, session(20), 9_000)!;
        expect(progressValues(p2, 9_000)['media.elapsed']).to.equal(20);
    });

    it('stops counting when paused and keeps the shown position', () => {
        const p1 = updateProgress(undefined, session(10), 0)!;
        const p2 = updateProgress(p1, session(10, true), 4_000)!;
        expect(progressValues(p2, 4_000)['media.elapsed']).to.equal(14);
        expect(progressValues(p2, 60_000)['media.elapsed']).to.equal(14);
        const p3 = updateProgress(p2, session(10), 70_000)!;
        expect(progressValues(p3, 72_000)['media.elapsed']).to.equal(16);
    });

    it('starts again for a new item and never passes the duration', () => {
        const p1 = updateProgress(undefined, session(190), 0)!;
        expect(progressValues(p1, 30_000)['media.elapsed']).to.equal(200);
        const p2 = updateProgress(p1, session(190, false, 'a2'), 1_000)!;
        expect(progressValues(p2, 1_000)['media.elapsed']).to.equal(190);
    });

    it('returns nothing when nothing is playing', () => {
        expect(updateProgress(undefined, { Id: 's1', DeviceId: 'd1' }, 0)).to.equal(undefined);
    });
});
