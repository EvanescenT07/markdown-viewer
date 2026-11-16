export interface HastText {
  type: "text";
  value: string;
}

export interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}

export interface HastRoot {
  type: "root";
  children: HastNode[];
}

export type HastNode =
  | HastRoot
  | HastElement
  | HastText
  | {
      type: string;
      children?: HastNode[];
      value?: unknown;
    };

// Inline formatting wrappers whose children can split across semicolons while keeping the outer style.
const TRANSPARENT_PHRASING_TAGS = new Set([
  "strong",
  "em",
  "del",
  "s",
  "b",
  "i",
  "ins",
  "sub",
  "sup",
  "span",
  "q",
]);

const BLOCK_TAGS = new Set([
  "ul",
  "ol",
  "table",
  "pre",
  "blockquote",
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "section",
  "details",
]);

const MEANINGFUL_VOID_TAGS = new Set(["img", "input", "picture", "svg"]);
const ATOMIC_CONTENT_TAGS = new Set(["code", "a", "kbd", "samp", "var"]);
const COMPACT_COLUMN_HEADERS = new Set(["#", "date", "hash", "type"]);
const MAX_COMPACT_CELL_LENGTH = 24;

function isElement(node: HastNode): node is HastElement {
  return (
    node.type === "element" &&
    "tagName" in node &&
    typeof node.tagName === "string" &&
    Array.isArray(node.children)
  );
}

function isText(node: HastNode): node is HastText {
  return (
    node.type === "text" &&
    "value" in node &&
    typeof node.value === "string"
  );
}

function isBreakElement(node: HastNode): boolean {
  return isElement(node) && node.tagName === "br";
}

function extractPlainText(nodes: readonly HastNode[]): string {
  let result = "";
  for (const node of nodes) {
    if (isText(node)) {
      result += node.value;
    } else if (isElement(node)) {
      result += extractPlainText(node.children);
    }
  }
  return result;
}

function normalizeHeaderText(cell: HastElement): string {
  return extractPlainText(cell.children)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getColumnSpan(cell: HastElement): number {
  const rawSpan = cell.properties?.colSpan;
  if (typeof rawSpan === "number" && Number.isFinite(rawSpan) && rawSpan >= 1) {
    return Math.floor(rawSpan);
  }
  if (typeof rawSpan === "string") {
    const parsed = Number.parseInt(rawSpan, 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return 1;
}

function clonePropertiesWithoutId(
  properties: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!properties) {
    return {};
  }
  const cloned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    // Strip id so splitting a wrapped inline element never introduces duplicate DOM IDs.
    if (key !== "id") {
      cloned[key] = value;
    }
  }
  return cloned;
}

function hasMeaningfulContent(nodes: readonly HastNode[]): boolean {
  for (const node of nodes) {
    if (isText(node)) {
      if (node.value.trim().length > 0) {
        return true;
      }
      continue;
    }
    if (isBreakElement(node)) {
      continue;
    }
    if (isElement(node)) {
      if (MEANINGFUL_VOID_TAGS.has(node.tagName)) {
        return true;
      }
      if (ATOMIC_CONTENT_TAGS.has(node.tagName) && node.children.length > 0) {
        return true;
      }
      if (hasMeaningfulContent(node.children)) {
        return true;
      }
    }
  }
  return false;
}

function splitSingleNode(node: HastNode): HastNode[][] {
  if (isText(node)) {
    if (!node.value.includes(";")) {
      return [[node]];
    }
    return node.value
      .split(";")
      .map((segment) =>
        segment.length > 0 ? [{ type: "text", value: segment }] : []
      );
  }

  if (isElement(node) && TRANSPARENT_PHRASING_TAGS.has(node.tagName)) {
    const innerSegments = splitNodesOnSemicolon(node.children);
    if (innerSegments.length === 1) {
      return [[node]];
    }
    return innerSegments.map((segmentNodes) => {
      if (!hasMeaningfulContent(segmentNodes)) {
        return [];
      }
      return [
        {
          type: "element",
          tagName: node.tagName,
          properties: clonePropertiesWithoutId(node.properties),
          children: segmentNodes,
        },
      ];
    });
  }

  // Keep inline code, links, and void tags intact so semicolons inside symbols or URLs never split.
  return [[node]];
}

export function splitNodesOnSemicolon(nodes: readonly HastNode[]): HastNode[][] {
  const items: HastNode[][] = [[]];

  for (const node of nodes) {
    const segments = splitSingleNode(node);
    const firstSegment = segments[0];
    const currentItem = items[items.length - 1];
    if (currentItem && firstSegment) {
      currentItem.push(...firstSegment);
    }

    for (let index = 1; index < segments.length; index++) {
      const nextSegment = segments[index];
      items.push(nextSegment ? [...nextSegment] : []);
    }
  }

  return items;
}

function trimEdgeText(
  nodes: readonly HastNode[],
  side: "start" | "end"
): HastNode[] {
  const copy = [...nodes];

  while (copy.length > 0) {
    const edgeIndex = side === "start" ? 0 : copy.length - 1;
    const edgeNode = copy[edgeIndex];
    if (!edgeNode) {
      break;
    }

    if (isBreakElement(edgeNode)) {
      copy.splice(edgeIndex, 1);
      continue;
    }

    if (isText(edgeNode)) {
      const trimmedValue =
        side === "start" ? edgeNode.value.trimStart() : edgeNode.value.trimEnd();
      if (trimmedValue.length === 0) {
        copy.splice(edgeIndex, 1);
        continue;
      }
      if (trimmedValue !== edgeNode.value) {
        copy[edgeIndex] = { type: "text", value: trimmedValue };
      }
      break;
    }

    if (isElement(edgeNode) && TRANSPARENT_PHRASING_TAGS.has(edgeNode.tagName)) {
      const trimmedChildren = trimEdgeText(edgeNode.children, side);
      if (trimmedChildren.length === 0) {
        copy.splice(edgeIndex, 1);
        continue;
      }
      copy[edgeIndex] = {
        ...edgeNode,
        children: trimmedChildren,
      };
      break;
    }

    break;
  }

  return copy;
}

function trimItemNodes(nodes: readonly HastNode[]): HastNode[] {
  return trimEdgeText(trimEdgeText(nodes, "start"), "end");
}

function hasBlockChildren(nodes: readonly HastNode[]): boolean {
  return nodes.some(
    (node) => isElement(node) && BLOCK_TAGS.has(node.tagName)
  );
}

function transformSubjectCell(cell: HastElement): void {
  cell.properties = {
    ...cell.properties,
    dataSubjectColumn: "true",
  };

  if (hasBlockChildren(cell.children)) {
    return;
  }

  const rawSegments = splitNodesOnSemicolon(cell.children);
  const hadSemicolonSplit = rawSegments.length > 1;
  const cleanedItems = rawSegments
    .map(trimItemNodes)
    .filter((item) => item.length > 0);

  if (cleanedItems.length === 0) {
    cell.children = [];
    return;
  }

  if (cleanedItems.length === 1) {
    if (hadSemicolonSplit) {
      cell.children = cleanedItems[0] ?? [];
    }
    return;
  }

  cell.children = [
    {
      type: "element",
      tagName: "ul",
      properties: {
        className: ["documark-subject-list"],
      },
      children: cleanedItems.map((itemNodes) => ({
        type: "element",
        tagName: "li",
        properties: {},
        children: itemNodes,
      })),
    },
  ];
}

function getTableRows(
  table: HastElement
): { headerRows: HastElement[]; bodyRows: HastElement[] } {
  const headerRows: HastElement[] = [];
  const bodyRows: HastElement[] = [];

  for (const child of table.children) {
    if (!isElement(child)) {
      continue;
    }
    if (child.tagName === "thead") {
      for (const row of child.children) {
        if (isElement(row) && row.tagName === "tr") {
          headerRows.push(row);
        }
      }
    } else if (child.tagName === "tbody") {
      for (const row of child.children) {
        if (isElement(row) && row.tagName === "tr") {
          bodyRows.push(row);
        }
      }
    } else if (child.tagName === "tr") {
      bodyRows.push(child);
    }
  }

  if (headerRows.length === 0 && bodyRows.length > 0) {
    const firstRow = bodyRows[0];
    if (firstRow) {
      const firstRowCells = firstRow.children.filter(isElement);
      const isHeaderOnlyRow =
        firstRowCells.length > 0 &&
        firstRowCells.every((cell) => cell.tagName === "th");
      if (isHeaderOnlyRow) {
        headerRows.push(firstRow);
        bodyRows.shift();
      }
    }
  }

  return { headerRows, bodyRows };
}

function transformTableElement(table: HastElement): void {
  const { headerRows, bodyRows } = getTableRows(table);
  if (headerRows.length === 0) {
    return;
  }

  const subjectColumnIndices = new Set<number>();
  const compactColumnIndices = new Set<number>();

  for (const headerRow of headerRows) {
    let columnIndex = 0;
    for (const node of headerRow.children) {
      if (!isElement(node) || (node.tagName !== "th" && node.tagName !== "td")) {
        continue;
      }
      const colSpan = getColumnSpan(node);
      if (node.tagName === "th" && colSpan === 1) {
        const headerText = normalizeHeaderText(node);
        if (headerText === "subject") {
          subjectColumnIndices.add(columnIndex);
          node.properties = {
            ...node.properties,
            dataSubjectColumn: "true",
          };
        } else if (COMPACT_COLUMN_HEADERS.has(headerText)) {
          compactColumnIndices.add(columnIndex);
        }
      }
      columnIndex += colSpan;
    }
  }

  if (subjectColumnIndices.size === 0) {
    return;
  }

  for (const bodyRow of bodyRows) {
    let columnIndex = 0;
    for (const cell of bodyRow.children) {
      if (!isElement(cell) || (cell.tagName !== "td" && cell.tagName !== "th")) {
        continue;
      }
      const colSpan = getColumnSpan(cell);
      if (cell.tagName === "td" && colSpan === 1) {
        if (subjectColumnIndices.has(columnIndex)) {
          transformSubjectCell(cell);
        } else if (
          compactColumnIndices.has(columnIndex) &&
          !hasBlockChildren(cell.children)
        ) {
          const cellText = extractPlainText(cell.children).trim();
          if (cellText.length > 0 && cellText.length <= MAX_COMPACT_CELL_LENGTH) {
            cell.properties = {
              ...cell.properties,
              dataCompactCell: "true",
            };
          }
        }
      }
      columnIndex += colSpan;
    }
  }
}

export function transformSubjectTables(node: HastNode): void {
  if (!("children" in node) || !Array.isArray(node.children)) {
    return;
  }

  if (isElement(node) && node.tagName === "table") {
    transformTableElement(node);
  }

  for (const child of node.children) {
    transformSubjectTables(child);
  }
}

/**
 * Rehype plugin that renders semicolon-separated `Subject` table cells as bullet lists.
 */
export function rehypeSubjectBulletLists() {
  return (tree: HastRoot): void => {
    transformSubjectTables(tree);
  };
}
