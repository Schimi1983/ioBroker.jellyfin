import { describe, it } from 'mocha';
import { expect } from 'chai';
import { findPlaylist, mergePlaylists, playlistStates } from './playlists';

describe('playlists', () => {
    const anna = [
        { Id: 'p2', Name: 'Party', ChildCount: 40 },
        { Id: 'p1', Name: 'abends' },
    ];
    const ben = [
        { Id: 'p2', Name: 'Party', ChildCount: 40 },
        { Id: 'p3', Name: 'Party' },
    ];

    it('merges the lists of all users without duplicates, sorted by name', () => {
        const list = mergePlaylists([anna, ben]);
        expect(list.map(p => p.id)).to.deep.equal(['p1', 'p2', 'p3']);
        expect(list[1]).to.deep.equal({ id: 'p2', name: 'Party', count: 40 });
    });

    it('offers each name once for selection', () => {
        expect(playlistStates(mergePlaylists([anna, ben]))).to.deep.equal({ abends: 'abends', Party: 'Party' });
    });

    it('finds a playlist by id or by name, ignoring case', () => {
        const list = mergePlaylists([anna, ben]);
        expect(findPlaylist(list, 'p3')?.id).to.equal('p3');
        expect(findPlaylist(list, ' ABENDS ')?.id).to.equal('p1');
        expect(findPlaylist(list, 'unknown')).to.equal(undefined);
        expect(findPlaylist(list, '')).to.equal(undefined);
    });
});
