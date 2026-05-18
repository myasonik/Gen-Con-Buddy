import type React from "react";
import { parseCSV } from "../../utils/parseCSV";
import type { SearchParams } from "../../utils/searchParamSchema";
import { FILTER_FIELDS, type FieldDescriptor } from "../../utils/filterFields";

export interface ActiveFilter {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string }>;
  remove: (prev: SearchParams) => SearchParams;
}

function parseRange(val: string): { min: string; max: string } | null {
  const m = val.match(/^\[([^,]*),([^\]]*)\]$/);
  if (!m) {
    return null;
  }
  return { min: m[1], max: m[2] };
}

function fmtDate(iso: string): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRange(val: string, prefix: string, suffix = ""): string {
  const r = parseRange(val);
  if (!r) {
    return `${prefix}${val}`;
  }
  return `${prefix}${r.min}–${r.max}${suffix ? ` ${suffix}` : ""}`;
}

function fmtDateRange(val: string, prefix: string): string {
  const r = parseRange(val);
  if (!r) {
    return `${prefix}${val}`;
  }
  return `${prefix}${fmtDate(r.min)}–${fmtDate(r.max)}`;
}

function fmtCostRange(val: string): string {
  const r = parseRange(val);
  if (!r) {
    return `Cost: ${val}`;
  }
  const min = r.min ? `$${r.min}` : "";
  const max = r.max ? `$${r.max}` : "";
  const dash = min || max ? "–" : "";
  return `Cost: ${min}${dash}${max}`;
}

function fmtTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const use12h =
    new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12 ?? false;
  if (!use12h) {
    return m === 0 ? `${hStr}:00` : `${hStr}:${mStr}`;
  }
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${mStr} ${ampm}`;
}

function removeKey(key: keyof SearchParams): (prev: SearchParams) => SearchParams {
  return (prev) => {
    const { [key]: _r, ...rest } = prev;
    return rest;
  };
}

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  // Time range chip — combines timeStart and timeEnd into one removable chip
  const { timeStart, timeEnd } = params;
  if (timeStart || timeEnd) {
    let label = `Before ${fmtTime(timeEnd ?? "")}`;
    if (timeStart && timeEnd) {
      label = `${fmtTime(timeStart)}–${fmtTime(timeEnd)}`;
    } else if (timeStart) {
      label = `After ${fmtTime(timeStart)}`;
    }
    filters.push({
      id: "timeRange",
      label,
      icon: FILTER_FIELDS.timeStart.icon,
      remove: (prev) => {
        const { timeStart: _s, timeEnd: _e, ...rest } = prev;
        return rest;
      },
    });
  }

  for (const [key, def] of Object.entries(FILTER_FIELDS) as [
    keyof SearchParams,
    FieldDescriptor,
  ][]) {
    if (def.type === "combined") {
      // handled above as a combined timeRange chip
    } else {
      const val = params[key];
      if (val) {
        if (def.type === "plain") {
          filters.push({
            id: key,
            label: `${def.label}: ${val}`,
            icon: def.icon,
            remove: removeKey(key),
          });
        } else if (def.type === "enum") {
          const display = def.options[val as string] ?? (val as string);
          filters.push({
            id: key,
            label: `${def.label}: ${display}`,
            icon: def.icon,
            remove: removeKey(key),
          });
        } else if (def.type === "range") {
          filters.push({
            id: key,
            label: fmtRange(val as string, `${def.label}: `, def.suffix),
            icon: def.icon,
            remove: removeKey(key),
          });
        } else if (def.type === "dateRange") {
          filters.push({
            id: key,
            label: fmtDateRange(val as string, `${def.label}: `),
            icon: def.icon,
            remove: removeKey(key),
          });
        } else if (def.type === "cost") {
          filters.push({
            id: key,
            label: fmtCostRange(val as string),
            icon: def.icon,
            remove: removeKey(key),
          });
        } else if (def.type === "multi") {
          for (const code of parseCSV(val as string)) {
            const label = def.options?.[code] ?? code;
            const chipIcon = def.iconMap ? def.iconMap[code] : def.icon;
            filters.push({
              id: `${def.prefix}:${code}`,
              label,
              icon: chipIcon,
              remove: (prev) => {
                const remaining = ((prev[key] ?? "") as string)
                  .split(",")
                  .filter((c) => c !== code)
                  .join(",");
                if (!remaining) {
                  const { [key]: _r, ...rest } = prev;
                  return rest;
                }
                return { ...prev, [key]: remaining };
              },
            });
          }
        }
      }
    }
  }

  return filters;
}
