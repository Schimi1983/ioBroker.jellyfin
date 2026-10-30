// This file extends the AdapterConfig type from "@iobroker/types"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            /** Server address incl. port and optional base path */
            url: string;
            /** API key (encrypted) */
            apiKey: string;
            /** Interval of the session push in seconds */
            updateInterval: number;
            /** Max. cover height in px, 0 = original */
            coverHeight: number;
            /** Only create devices that can be remote-controlled */
            onlyRemoteControllable: boolean;
            /** Request timeout in seconds */
            requestTimeout: number;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
