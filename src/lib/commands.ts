/** Parameters of the `message` sendTo command and of `command.message` as JSON. */
export interface MessagePayload {
    /** message text */
    text: string;
    /** optional header (default "ioBroker") */
    header?: string;
    /** optional display time in ms (ignored by the Android TV app) */
    timeoutMs?: number;
}

/**
 * Parses a message: plain text or JSON `{"text","header","timeoutMs"}` (also accepts Jellyfin's `Text`/`Header`).
 *
 * @param val - state value or sendTo payload
 */
export function parseMessage(val: unknown): MessagePayload | null {
    let obj: Record<string, unknown> | null = null;
    if (typeof val === 'string') {
        const t = val.trim();
        if (!t) {
            return null;
        }
        if (t.startsWith('{')) {
            try {
                obj = JSON.parse(t) as Record<string, unknown>;
            } catch {
                return { text: t };
            }
        } else {
            return { text: t };
        }
    } else if (val && typeof val === 'object') {
        obj = val as Record<string, unknown>;
    }
    if (!obj) {
        return null;
    }
    const text = obj.text ?? obj.Text;
    if (typeof text !== 'string' || !text.trim()) {
        return null;
    }
    const header = obj.header ?? obj.Header;
    const timeout = Number(obj.timeoutMs ?? obj.TimeoutMs);
    return {
        text: text.trim(),
        header: typeof header === 'string' && header.trim() ? header.trim() : undefined,
        timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : undefined,
    };
}

/**
 * Parses `command.generalCommand`: a command name (`GoHome`) or JSON `{"Name":"…","Arguments":{…}}`.
 *
 * @param val - state value
 */
export function parseGeneralCommand(val: unknown): { name: string; args?: Record<string, string> } | null {
    if (typeof val !== 'string' || !val.trim()) {
        return null;
    }
    const t = val.trim();
    if (!t.startsWith('{')) {
        return /^[A-Za-z]+$/.test(t) ? { name: t } : null;
    }
    try {
        const obj = JSON.parse(t) as { Name?: unknown; Arguments?: Record<string, unknown> };
        if (typeof obj.Name !== 'string' || !/^[A-Za-z]+$/.test(obj.Name)) {
            return null;
        }
        const args: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj.Arguments ?? {})) {
            args[k] = String(v);
        }
        return { name: obj.Name, args };
    } catch {
        return null;
    }
}
