import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TRANSLATED_NAMES, tr } from './names';
import { DEVICE_CHANNELS, DEVICE_STATES, SERVER_STATES } from './objects';

describe('object names', () => {
    it('has a translation for every state and channel name', () => {
        const names = [
            ...DEVICE_STATES.map(d => d.name),
            ...SERVER_STATES.map(d => d.name),
            ...Object.values(DEVICE_CHANNELS),
            'Jellyfin server',
        ];
        const missing = names.filter(n => !TRANSLATED_NAMES.has(n));
        expect(missing).to.deep.equal([]);
    });

    it('returns all 11 languages', () => {
        const name = tr('Title') as Record<string, string>;
        expect(Object.keys(name)).to.have.length(11);
        expect(name.de).to.equal('Titel');
    });
});
