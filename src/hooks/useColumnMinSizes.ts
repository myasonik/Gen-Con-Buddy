import { useEffect, useState, type RefObject } from "react";
import type { Event } from "../utils/types";

export function useColumnMinSizes(
  tableRef: RefObject<HTMLTableElement | null>,
  events: Event[],
): Record<string, number> {
  const [minSizes, setMinSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    const table = tableRef.current;
    if (!table) {
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const sampleTd = table.querySelector<HTMLTableCellElement>("tbody td");
    let paddingH = 0;
    if (sampleTd) {
      const tdStyle = getComputedStyle(sampleTd);
      ctx.font = tdStyle.font;
      paddingH =
        (parseFloat(tdStyle.paddingLeft) || 0) +
        (parseFloat(tdStyle.paddingRight) || 0) +
        (parseFloat(tdStyle.borderLeftWidth) || 0) +
        (parseFloat(tdStyle.borderRightWidth) || 0);
    }

    const gapCache = new Map<Element, number>();
    const result: Record<string, number> = {};

    table.querySelectorAll<HTMLTableCellElement>("tbody td[data-col-id]").forEach((td) => {
      const colId = td.getAttribute("data-col-id");
      if (!colId) {
        return;
      }

      const longestWord =
        (td.textContent ?? "")
          .trim()
          .split(/\s+/)
          .sort((a, b) => b.length - a.length)[0] ?? "";
      const textWidth = ctx.measureText(longestWord).width;

      const svgs = Array.from(td.querySelectorAll<SVGElement>("svg"));
      const svgWidth = svgs.reduce((sum, svg) => sum + (Number(svg.getAttribute("width")) || 0), 0);

      let gap = 0;
      if (svgs.length > 0) {
        const parent = svgs[0].parentElement;
        if (parent) {
          if (!gapCache.has(parent)) {
            const parsed = parseFloat(getComputedStyle(parent).gap);
            gapCache.set(parent, Number.isNaN(parsed) ? 4 : parsed);
          }
          gap = gapCache.get(parent) ?? 4;
        }
      }

      const cellMin = Math.ceil(textWidth + svgWidth + gap + paddingH);
      result[colId] = Math.max(result[colId] ?? 0, cellMin);
    });

    setMinSizes(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]); // tableRef is a stable ref — intentionally omitted from deps

  return minSizes;
}
