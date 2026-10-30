/**
 * Minimal type definitions for the parts of the Jellyfin API (12.x) used by this adapter.
 * Only fields that are actually read are declared; everything is optional because clients
 * report very different subsets (see README "Supported clients").
 */

/** Response of GET /System/Info (subset). */
export interface SystemInfo {
    ServerName?: string;
    Version?: string;
    Id?: string;
    HasPendingRestart?: boolean;
    HasUpdateAvailable?: boolean;
}

/** Media item that is currently playing (subset of BaseItemDto). */
export interface NowPlayingItem {
    Id?: string;
    Name?: string;
    Type?: string;
    MediaType?: string;
    SeriesName?: string;
    SeriesId?: string;
    SeriesPrimaryImageTag?: string;
    SeasonName?: string;
    ParentIndexNumber?: number;
    IndexNumber?: number;
    ProductionYear?: number;
    RunTimeTicks?: number;
    Genres?: string[];
    Artists?: string[];
    Album?: string;
    AlbumId?: string;
    AlbumPrimaryImageTag?: string;
    ImageTags?: Record<string, string>;
}

/** Playback state of a session (subset of PlayerStateInfo). */
export interface PlayState {
    PositionTicks?: number;
    IsPaused?: boolean;
    IsMuted?: boolean;
    VolumeLevel?: number;
    RepeatMode?: RepeatMode;
    CanSeek?: boolean;
}

/** Repeat modes known by Jellyfin. */
export type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';

/** One entry of GET /Sessions or of the WebSocket message "Sessions" (subset of SessionInfoDto). */
export interface SessionInfo {
    Id: string;
    DeviceId: string;
    DeviceName?: string;
    Client?: string;
    ApplicationVersion?: string;
    UserName?: string;
    LastActivityDate?: string;
    IsActive?: boolean;
    SupportsRemoteControl?: boolean;
    SupportsMediaControl?: boolean;
    SupportedCommands?: string[];
    NowPlayingItem?: NowPlayingItem | null;
    PlayState?: PlayState;
}

/** Envelope of every WebSocket message. */
export interface SocketMessage {
    MessageType: string;
    Data?: unknown;
    MessageId?: string;
}

/** Playstate commands of POST /Sessions/{id}/Playing/{command}. */
export type PlaystateCommand =
    'Stop' | 'Pause' | 'Unpause' | 'NextTrack' | 'PreviousTrack' | 'Seek' | 'Rewind' | 'FastForward' | 'PlayPause';
