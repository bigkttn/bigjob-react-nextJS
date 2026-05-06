const rateMap = new Map<string, { count: number; last: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
    const now = Date.now();
    const data = rateMap.get(key);

    if (!data) {
        rateMap.set(key, { count: 1, last: now });
        return true;
    }

    if (now - data.last > windowMs) {
        rateMap.set(key, { count: 1, last: now });
        return true;
    }

    if (data.count >= limit) {
        return false;
    }

    data.count++;
    return true;
}