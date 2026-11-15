export interface WallClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function utcTimestamp(parts: WallClockParts): number | null {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  const timestamp = date.getTime();
  if (
    !Number.isSafeInteger(timestamp) ||
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() + 1 !== parts.month ||
    date.getUTCDate() !== parts.day ||
    date.getUTCHours() !== parts.hour ||
    date.getUTCMinutes() !== parts.minute ||
    date.getUTCSeconds() !== parts.second
  ) return null;
  return timestamp;
}

export function getWallClockParts(
  timestamp: number,
  timeZone: string,
): WallClockParts | null {
  if (!Number.isSafeInteger(timestamp)) return null;
  try {
    const formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]),
    );
    const result = {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      second: Number(parts.second),
    };
    return Object.values(result).every(Number.isInteger) ? result : null;
  } catch {
    return null;
  }
}

export function wallClockToTimestamp(
  parts: WallClockParts,
  timeZone: string,
): number | null {
  const targetWallClock = utcTimestamp(parts);
  if (targetWallClock == null) return null;

  let candidate = targetWallClock;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const local = getWallClockParts(candidate, timeZone);
    if (!local) return null;
    const representedAsUtc = utcTimestamp(local);
    if (representedAsUtc == null) return null;

    const adjustment = targetWallClock - representedAsUtc;
    if (adjustment === 0) {
      return local.year === parts.year &&
        local.month === parts.month &&
        local.day === parts.day &&
        local.hour === parts.hour &&
        local.minute === parts.minute &&
        local.second === parts.second
        ? candidate
        : null;
    }
    candidate += adjustment;
  }

  const resolved = getWallClockParts(candidate, timeZone);
  return resolved &&
    resolved.year === parts.year &&
    resolved.month === parts.month &&
    resolved.day === parts.day &&
    resolved.hour === parts.hour &&
    resolved.minute === parts.minute &&
    resolved.second === parts.second
    ? candidate
    : null;
}

export function nextLocalMidnight(timestamp: number, timeZone: string): number | null {
  const current = getWallClockParts(timestamp, timeZone);
  if (
    !current ||
    current.hour !== 0 ||
    current.minute !== 0 ||
    current.second !== 0
  ) return null;

  const nextDate = new Date(0);
  nextDate.setUTCFullYear(current.year, current.month - 1, current.day + 1);
  nextDate.setUTCHours(0, 0, 0, 0);
  return wallClockToTimestamp({
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  }, timeZone);
}
