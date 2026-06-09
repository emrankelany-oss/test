// IMPACT-BBDO grid generator, generalized to any item count.
//
// The source (impactbbdo.com/work) is a 6-column CSS grid whose 12 cards are
// hand-placed by :nth-child into a repeating editorial "module": one tall
// portrait hero (3 cols × 4 rows), two wide landscapes stacked beside it
// (3 cols × 2 rows each), and a row of three squares below (2 cols × 2 rows).
// The hero alternates left ↔ right every module, giving the zig-zag rhythm.
//
// We reproduce that exactly but per-module so it adapts to a category of any
// size: each module owns 6 grid rows, the hero's column-start flips by module
// parity, and the row heights cycle (tall, tall, tall, tall, short, short) via
// the container's `grid-auto-rows`, matching the source's 243/158px two-tier.

export const MODULE_ROWS = 6; // grid rows consumed by one full module
const ITEMS_PER_MODULE = 6;

// Returns one {colStart,colSpan,rowStart,rowSpan,kind} per item, in order.
export function layoutFor(works) {
  const count = works.length;
  const cells = [];
  
  // Check if the first two works are the featured ones (Foodics and Zid)
  const hasFeaturedStart = 
    count >= 2 && 
    works[0].slug === "foodics-boundless" && 
    works[1].slug === "zid-ripple";

  let i = 0;
  let rowOffset = 0;

  if (hasFeaturedStart) {
    // Both Foodics and Zid get a full hero treatment side-by-side
    cells.push({ kind: "hero", colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 4 });
    cells.push({ kind: "hero", colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 4 });
    i = 2; // skip the first two
    rowOffset = 4; // pushed down by the 4 rows taken by the double hero
  }

  for (; i < count; i++) {
    // Treat the remaining items as if they were starting from index 0 in the module logic
    const logicalIndex = hasFeaturedStart ? i - 2 : i;
    const mod = Math.floor(logicalIndex / ITEMS_PER_MODULE);
    const pos = logicalIndex % ITEMS_PER_MODULE;
    const heroLeft = mod % 2 === 0;
    const rowBase = mod * MODULE_ROWS + 1 + rowOffset; // 1-indexed grid rows
    
    // The "wide" stack and squares live on the opposite side / below the hero.
    const wideCol = heroLeft ? 4 : 1; // wides sit beside the hero
    if (pos === 0) {
      cells.push({ kind: "hero", colStart: heroLeft ? 1 : 4, colSpan: 3, rowStart: rowBase, rowSpan: 4 });
    } else if (pos === 1) {
      cells.push({ kind: "wide", colStart: wideCol, colSpan: 3, rowStart: rowBase, rowSpan: 2 });
    } else if (pos === 2) {
      cells.push({ kind: "wide", colStart: wideCol, colSpan: 3, rowStart: rowBase + 2, rowSpan: 2 });
    } else {
      // pos 3,4,5 → three squares across the short row band
      const j = pos - 3; // 0,1,2
      cells.push({ kind: "square", colStart: 1 + j * 2, colSpan: 2, rowStart: rowBase + 4, rowSpan: 2 });
    }
  }
  return cells;
}
