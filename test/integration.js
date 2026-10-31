const path = require('path');
const crypto = require('crypto');
const { expect } = require('chai');
const { tests } = require('@iobroker/testing');
const { MockJellyfin, API_KEY, TICKS } = require('./lib/mockJellyfin');

/** Object id the adapter uses for the iPad of the mock (app + player merged). */
const IPAD = crypto.createHash('sha1').update('Jellyfin iPadOS|test-ipad|user1').digest('hex').slice(0, 16);
const NS = 'jellyfin.0';

// @KI_HINWEIS: generous timeouts – the Windows runners of GitHub Actions are much slower than a local PC.
/** Polls until fn returns a truthy value (or throws after timeout). */
async function waitFor(fn, timeout = 30000, what = 'condition') {
    const end = Date.now() + timeout;
    for (;;) {
        const res = await fn();
        if (res) {
            return res;
        }
        if (Date.now() > end) {
            throw new Error(`Timeout waiting for ${what}`);
        }
        await new Promise(r => setTimeout(r, 250));
    }
}

// Run integration tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Against a mocked Jellyfin 12 server', getHarness => {
            let harness;
            let mock;

            before(async function () {
                this.timeout(120000);
                mock = new MockJellyfin();
                const port = await mock.start();
                harness = getHarness();
                await harness.changeAdapterConfig('jellyfin', {
                    native: { url: `http://127.0.0.1:${port}`, apiKey: API_KEY, updateInterval: 2 },
                });
                await harness.startAdapterAndWait();
            });

            after(async () => {
                await mock?.stop();
            });

            const state = id => harness.states.getStateAsync(`${NS}.${id}`);

            it('connects and reads the server info', async function () {
                this.timeout(60000);
                await waitFor(async () => (await state('info.connection'))?.val === true, 30000, 'info.connection');
                expect((await state('server.version'))?.val).to.equal('12.4.0');
                expect((await state('server.updateAvailable'))?.val).to.equal(true);
                expect(mock.find('WS', 'SessionsStart')).to.have.length.greaterThan(0);
            });

            it('merges app and player of the iPad into one device and ignores its own session', async function () {
                this.timeout(60000);
                // playingDevices is written last – then all states of the device are there
                await waitFor(async () => (await state('server.playingDevices'))?.val === 1, 30000, 'playingDevices');
                expect((await state(`${IPAD}.media.title`))?.val).to.equal('Test Movie');
                expect((await state(`${IPAD}.info.remoteControl`))?.val).to.equal(true);
                expect((await state(`${IPAD}.media.state`))?.val).to.equal('play');
                expect((await state(`${IPAD}.media.elapsed`))?.val).to.equal(600);
                expect((await state(`${IPAD}.media.cover`))?.val).to.contain('/Items/item-movie/Images/Primary');
                expect((await state('server.activeDevices'))?.val).to.equal(1);
                expect(await harness.objects.getObjectAsync(`${NS}.ioBroker-jellyfin.0`)).to.not.be.ok;
                const obj = await harness.objects.getObjectAsync(`${NS}.${IPAD}.media.state`);
                expect(obj.common.role).to.equal('media.state');
            });

            it('sends playback commands to the controllable session', async function () {
                this.timeout(60000);
                await harness.states.setStateAsync(`${NS}.${IPAD}.command.pause`, { val: true, ack: false });
                await waitFor(() => mock.find('POST', '/Sessions/sess-ipad-app/Playing/Pause').length, 30000, 'Pause');
                await waitFor(async () => (await state(`${IPAD}.command.pause`))?.ack === true, 30000, 'ack');
            });

            it('jumps to a position using the duration of the playing session', async function () {
                this.timeout(60000);
                await harness.states.setStateAsync(`${NS}.${IPAD}.media.seek`, { val: 50, ack: false });
                const req = await waitFor(() => mock.find('POST', '/Sessions/sess-ipad-app/Playing/Seek')[0], 30000, 'Seek');
                expect(Number(req.query.seekPositionTicks)).to.equal(3000 * TICKS);
            });

            it('rejects an unsupported command and resets the value', async function () {
                this.timeout(60000);
                await harness.states.setStateAsync(`${NS}.${IPAD}.media.repeat`, { val: 'RepeatOne', ack: false });
                await waitFor(async () => (await state(`${IPAD}.media.repeat`))?.ack === true, 30000, 'reset');
                expect((await state(`${IPAD}.media.repeat`))?.val).to.not.equal('RepeatOne');
                expect(mock.find('POST', '/Sessions/sess-ipad-app/Command')).to.have.length(0);
            });

            it('starts playback by title', async function () {
                this.timeout(60000);
                await harness.states.setStateAsync(`${NS}.${IPAD}.command.playTitle`, { val: 'Test Family', ack: false });
                const req = await waitFor(() => mock.find('POST', '/Sessions/sess-ipad-app/Playing')[0], 30000, 'PlayNow');
                expect(req.query.playCommand).to.equal('PlayNow');
                expect(req.query.itemIds).to.equal('series-1');
            });

            it('shows a message', async function () {
                this.timeout(60000);
                await harness.states.setStateAsync(`${NS}.${IPAD}.command.message`, {
                    val: '{"text":"Doorbell","timeoutMs":5000}',
                    ack: false,
                });
                const req = await waitFor(() => mock.find('POST', '/Sessions/sess-ipad-app/Message')[0], 30000, 'Message');
                expect(req.body).to.deep.include({ Text: 'Doorbell', TimeoutMs: 5000 });
            });

            it('marks the device as not connected when its sessions disappear', async function () {
                this.timeout(60000);
                mock.sessions = [];
                mock.pushSessions();
                await waitFor(async () => (await state(`${IPAD}.info.reachable`))?.val === false, 30000, 'offline');
                expect((await state(`${IPAD}.media.state`))?.val).to.equal('stop');
            });
        });
    },
});
