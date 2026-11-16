import assert from "node:assert/strict";
import test from "node:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { toHtml } from "hast-util-to-html";
import { rehypeSubjectBulletLists } from "./subject-list";

function renderMarkdownToHtml(markdown: string): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize, defaultSchema)
    .use(rehypeSubjectBulletLists);

  const tree = processor.runSync(processor.parse(markdown));
  return toHtml(tree as Parameters<typeof toHtml>[0]);
}

test("renders multi-item Subject cells as bullet pointers while preserving inline formatting", () => {
  const markdown = [
    "| # | Date | Hash | Type | Branches | Subject |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | 2026-10-15 14:32 | `abc1234` | fix | dev/phase_3 | Guard `GetAllPublic`; update **auth** flow; check [spec](https://example.com/docs) |",
  ].join("\n");

  const html = renderMarkdownToHtml(markdown);

  assert.match(html, /<th data-subject-column="true">Subject<\/th>/);
  assert.match(html, /<td data-compact-cell="true">1<\/td>/);
  assert.match(html, /<td data-compact-cell="true">2026-10-15 14:32<\/td>/);
  assert.match(html, /<td data-compact-cell="true"><code>abc1234<\/code><\/td>/);
  assert.match(html, /<td data-compact-cell="true">fix<\/td>/);
  assert.match(html, /<td>dev\/phase_3<\/td>/);
  assert.ok(
    html.includes(
      '<td data-subject-column="true"><ul class="documark-subject-list"><li>Guard <code>GetAllPublic</code></li><li>update <strong>auth</strong> flow</li><li>check <a href="https://example.com/docs">spec</a></li></ul></td>'
    ),
    `Unexpected HTML: ${html}`
  );
});

test("does not split semicolons inside inline code, links, or autolinks", () => {
  const markdown = [
    "| Subject |",
    "| --- |",
    "| Fix `split(';')` parser; preserve `;` token; see [Part 1; 2](https://example.com/?a=1;b=2); keep https://example.com/x?p=1;q=2 |",
  ].join("\n");

  const html = renderMarkdownToHtml(markdown);

  assert.ok(
    html.includes(
      `<ul class="documark-subject-list"><li>Fix <code>split(';')</code> parser</li><li>preserve <code>;</code> token</li><li>see <a href="https://example.com/?a=1;b=2">Part 1; 2</a></li><li>keep <a href="https://example.com/x?p=1;q=2">https://example.com/x?p=1;q=2</a></li></ul>`
    ),
    `Unexpected HTML: ${html}`
  );
});

test("handles single-item cells, trailing semicolons, empty segments, and empty cells cleanly", () => {
  const markdown = [
    "| ID | Subject |",
    "| --- | --- |",
    "| 1 | Single commit summary |",
    "| 2 | Handle `a; b` inside single item |",
    "| 3 | Single item with stray trailing semicolon; |",
    "| 4 | ; Leading and consecutive;; <br> items; |",
    "| 5 | ; ; |",
    "| 6 |   |",
  ].join("\n");

  const html = renderMarkdownToHtml(markdown);

  assert.ok(
    html.includes('<td data-subject-column="true">Single commit summary</td>'),
    `Unexpected single item HTML: ${html}`
  );
  assert.ok(
    html.includes(
      '<td data-subject-column="true">Handle <code>a; b</code> inside single item</td>'
    ),
    `Unexpected code single item HTML: ${html}`
  );
  assert.ok(
    html.includes(
      '<td data-subject-column="true">Single item with stray trailing semicolon</td>'
    ),
    `Unexpected trailing semicolon HTML: ${html}`
  );
  assert.ok(
    html.includes(
      '<td data-subject-column="true"><ul class="documark-subject-list"><li>Leading and consecutive</li><li>items</li></ul></td>'
    ),
    `Unexpected consecutive semicolon HTML: ${html}`
  );
  assert.match(
    html,
    /<td>5<\/td>\s*<td data-subject-column="true"><\/td>/,
    `Unexpected semicolon-only cell HTML: ${html}`
  );
  assert.match(
    html,
    /<td>6<\/td>\s*<td data-subject-column="true"><\/td>/,
    `Unexpected empty cell HTML: ${html}`
  );
});

test("preserves bold or italic formatting spanning across semicolon boundaries", () => {
  const markdown = [
    "| Subject |",
    "| --- |",
    "| **First bold item; Second bold item**; *Third italic* |",
  ].join("\n");

  const html = renderMarkdownToHtml(markdown);

  assert.ok(
    html.includes(
      '<ul class="documark-subject-list"><li><strong>First bold item</strong></li><li><strong>Second bold item</strong></li><li><em>Third italic</em></li></ul>'
    ),
    `Unexpected formatted split HTML: ${html}`
  );
});

test("detects Subject header case-insensitively at any column index and ignores non-Subject tables", () => {
  const subjectMiddleMarkdown = [
    "| ID |   **SUBJECT**   | Notes |",
    "| --- | --- | --- |",
    "| 1 | First item; Second item | Keep semicolon; intact |",
  ].join("\n");

  const subjectMiddleHtml = renderMarkdownToHtml(subjectMiddleMarkdown);
  assert.match(
    subjectMiddleHtml,
    /<td>1<\/td>\s*<td data-subject-column="true"><ul class="documark-subject-list"><li>First item<\/li><li>Second item<\/li><\/ul><\/td>\s*<td>Keep semicolon; intact<\/td>/,
    `Unexpected middle-column HTML: ${subjectMiddleHtml}`
  );

  const nonSubjectMarkdown = [
    "| Subject Line | Summary |",
    "| --- | --- |",
    "| Alpha; Beta | One; Two |",
  ].join("\n");

  const nonSubjectHtml = renderMarkdownToHtml(nonSubjectMarkdown);
  assert.equal(nonSubjectHtml.includes("<ul"), false);
  assert.equal(nonSubjectHtml.includes("data-subject-column"), false);
  assert.ok(nonSubjectHtml.includes("<td>Alpha; Beta</td>"));
});

test("keeps rehypeSanitize XSS protection intact on Subject cells", () => {
  const maliciousMarkdown = [
    "| Subject |",
    "| --- |",
    "| <script>alert(1)</script>; [bad](javascript:alert(1)); <img src=x onerror=alert(2)>; Safe `code`; Next safe |",
  ].join("\n");

  const html = renderMarkdownToHtml(maliciousMarkdown);

  assert.equal(html.includes("<script"), false);
  assert.equal(html.includes("javascript:"), false);
  assert.equal(html.includes("onerror"), false);
  assert.ok(
    html.includes(
      '<ul class="documark-subject-list"><li>alert(1)</li><li><a>bad</a></li><li>Safe <code>code</code></li><li>Next safe</li></ul>'
    ),
    `Unexpected sanitized HTML: ${html}`
  );
});

test("skips nowrap on long Date cells and handles jagged rows safely", () => {
  const markdown = [
    "| Date | Subject |",
    "| --- | --- |",
    "| January 1, 2026 through December 31, 2026 | First; Second |",
    "| 2026-10-15 |",
  ].join("\n");

  const html = renderMarkdownToHtml(markdown);

  assert.ok(
    html.includes("<td>January 1, 2026 through December 31, 2026</td>"),
    `Long date cell should wrap: ${html}`
  );
  assert.ok(
    html.includes('<td data-compact-cell="true">2026-10-15</td>'),
    `Short date cell should keep compact flag: ${html}`
  );
});

test("transforms only Subject-bearing tables when a document has mixed tables", () => {
  const markdown = [
    "## Summary",
    "",
    "| Type | Count |",
    "| --- | --- |",
    "| feat | 2 |",
    "",
    "## Commits",
    "",
    "| # | Subject |",
    "| --- | --- |",
    "| 1 | Add [`useTheme;toggle`](https://example.com); drop legacy CSS |",
  ].join("\n");

  const html = renderMarkdownToHtml(markdown);

  assert.match(html, /<td>feat<\/td>\s*<td>2<\/td>/);
  assert.ok(
    html.includes(
      '<td data-subject-column="true"><ul class="documark-subject-list"><li>Add <a href="https://example.com"><code>useTheme;toggle</code></a></li><li>drop legacy CSS</li></ul></td>'
    ),
    `Unexpected mixed-tables HTML: ${html}`
  );
});
