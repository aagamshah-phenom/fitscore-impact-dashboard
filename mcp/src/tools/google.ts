import { randomBytes } from "crypto";
import type { ToolCall, ToolDefinition, CredentialProvider } from "../types.js";
import { logger } from "./lib/logger.js";

// ── Token management ──────────────────────────────────────────────────────────

/**
 * Returns a valid Google access token.
 * Token refresh (when within 5 minutes of expiry) is handled automatically
 * by FileCredentialProvider.getCredentials() via the backend.
 */
async function getGoogleTokenFromProvider(credProvider: CredentialProvider): Promise<string> {
  const row = await credProvider.getCredentials("google");
  if (!row?.access_token) throw new Error("Google Drive not connected. Run 'npm run setup google' to connect.");
  return row.access_token;
}

/** Extracts a Google document ID from a URL or returns the raw ID. */
function extractGoogleId(urlOrId: string): string {
  const m = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : urlOrId.trim();
}

function uid(): string {
  return randomBytes(4).toString("hex");
}

// ── Text extractors ───────────────────────────────────────────────────────────

interface DocElement {
  paragraph?: {
    elements?: Array<{ textRun?: { content?: string } }>;
    paragraphStyle?: { namedStyleType?: string };
  };
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{
        content?: Array<{
          paragraph?: { elements?: Array<{ textRun?: { content?: string } }> };
        }>;
      }>;
    }>;
  };
}

function extractDocText(doc: { body?: { content?: DocElement[] } }): string {
  const parts: string[] = [];
  for (const element of doc.body?.content ?? []) {
    if (element.paragraph) {
      const raw = (element.paragraph.elements ?? [])
        .map((e) => e.textRun?.content ?? "")
        .join("");
      const text = raw.replace(/\n$/, "").trim();
      if (!text) continue;
      const style = element.paragraph.paragraphStyle?.namedStyleType ?? "";
      if (style.startsWith("HEADING_")) {
        const level = parseInt(style.replace("HEADING_", ""), 10) || 1;
        parts.push("#".repeat(level) + " " + text);
      } else {
        parts.push(text);
      }
    } else if (element.table) {
      for (const row of element.table.tableRows ?? []) {
        const cells = (row.tableCells ?? []).map((cell) =>
          (cell.content ?? [])
            .flatMap((c) => (c.paragraph?.elements ?? []).map((e) => e.textRun?.content ?? ""))
            .join("")
            .trim()
        );
        if (cells.some((c) => c)) parts.push(cells.join(" | "));
      }
    }
  }
  return parts.join("\n");
}

interface SlideElement {
  shape?: {
    text?: { textElements?: Array<{ textRun?: { content?: string } }> };
    placeholder?: { type?: string };
  };
  objectId?: string;
}

function extractShapeText(shape: SlideElement["shape"]): string {
  return (shape?.text?.textElements ?? [])
    .map((e) => e.textRun?.content ?? "")
    .join("")
    .trim();
}

function extractSlideContent(slide: {
  pageElements?: SlideElement[];
  slideProperties?: { notesPage?: { pageElements?: SlideElement[] } };
}): { text: string; notes: string } {
  const textParts: string[] = [];
  for (const el of slide.pageElements ?? []) {
    const text = extractShapeText(el.shape);
    if (text) textParts.push(text);
  }

  let notes = "";
  for (const el of slide.slideProperties?.notesPage?.pageElements ?? []) {
    if (el.shape?.placeholder?.type === "BODY") {
      notes = extractShapeText(el.shape);
      break;
    }
  }

  return { text: textParts.join("\n"), notes };
}

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function listDriveFiles(
  token: string,
  params: { query?: string; mime_type?: string; max_results?: number }
): Promise<string> {
  const q_parts: string[] = ["trashed = false"];
  if (params.query) q_parts.push(`name contains '${params.query.replace(/'/g, "\\'")}'`);
  if (params.mime_type) q_parts.push(`mimeType = '${params.mime_type}'`);

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", q_parts.join(" and "));
  url.searchParams.set("pageSize", String(Math.min(params.max_results ?? 20, 50)));
  url.searchParams.set("fields", "files(id,name,mimeType,webViewLink,modifiedTime)");
  url.searchParams.set("orderBy", "modifiedTime desc");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return `Error listing Drive files: ${await res.text()}`;

  const data = (await res.json()) as {
    files?: Array<{ id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime?: string }>;
  };

  const files = data.files ?? [];
  if (files.length === 0) return "No files found.";

  return JSON.stringify(
    files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.mimeType.split(".").pop(),
      url: f.webViewLink,
      modified: f.modifiedTime,
    })),
    null,
    2
  );
}

async function readGoogleDoc(token: string, params: { document_id: string }): Promise<string> {
  const id = extractGoogleId(params.document_id);
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return `Error reading document: ${await res.text()}`;

  const doc = (await res.json()) as { title?: string; body?: { content?: DocElement[] } };
  const text = extractDocText(doc);
  return `# ${doc.title ?? "Untitled"}\n\n${text}`;
}

async function readGoogleSheet(
  token: string,
  params: { spreadsheet_id: string; sheet_name?: string; range?: string; max_rows?: number }
): Promise<string> {
  const id = extractGoogleId(params.spreadsheet_id);

  // Get spreadsheet metadata to enumerate tabs and resolve sheet name
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) return `Error reading spreadsheet: ${await metaRes.text()}`;

  const meta = (await metaRes.json()) as {
    properties?: { title?: string };
    sheets?: Array<{ properties?: { title?: string } }>;
  };

  const allTabs = (meta.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean);
  const sheetName = params.sheet_name ?? allTabs[0] ?? "Sheet1";

  // Build range: explicit A1 range takes priority, otherwise full sheet (optionally row-capped)
  let rangeParam: string;
  if (params.range) {
    rangeParam = `${sheetName}!${params.range}`;
  } else if (params.max_rows) {
    rangeParam = `${sheetName}!A1:ZZ${params.max_rows + 1}`; // +1 to include header row
  } else {
    rangeParam = sheetName;
  }

  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(rangeParam)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!valRes.ok) return `Error reading sheet "${sheetName}": ${await valRes.text()}`;

  const values = (await valRes.json()) as { values?: string[][] };
  const rows = values.values ?? [];
  if (rows.length === 0) return `Sheet "${sheetName}" is empty.`;

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const data = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });

  const tabNote = allTabs.length > 1
    ? `Available tabs: ${allTabs.join(", ")}\nReading: ${sheetName} (${dataRows.length} rows)\n\n`
    : `Reading: ${sheetName} (${dataRows.length} rows)\n\n`;

  return `# ${meta.properties?.title ?? "Spreadsheet"}\n${tabNote}${JSON.stringify(data, null, 2)}`;
}

async function readGoogleSlides(
  token: string,
  params: { presentation_id: string }
): Promise<string> {
  const id = extractGoogleId(params.presentation_id);
  const res = await fetch(`https://slides.googleapis.com/v1/presentations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return `Error reading presentation: ${await res.text()}`;

  const pres = (await res.json()) as {
    title?: string;
    slides?: Array<{
      objectId?: string;
      pageElements?: SlideElement[];
      slideProperties?: { notesPage?: { pageElements?: SlideElement[] } };
    }>;
  };

  const lines = [`# ${pres.title ?? "Untitled"}\n`];
  for (const [i, slide] of (pres.slides ?? []).entries()) {
    const { text, notes } = extractSlideContent(slide);
    lines.push(`## Slide ${i + 1}`);
    if (text) lines.push(text);
    if (notes) lines.push(`**Notes:** ${notes}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function createGoogleDoc(
  token: string,
  params: { title: string; content?: string }
): Promise<string> {
  // Step 1: Create the document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: params.title }),
  });
  if (!createRes.ok) return `Error creating document: ${await createRes.text()}`;

  const doc = (await createRes.json()) as { documentId: string; title?: string };

  // Step 2: Insert content if provided
  if (params.content) {
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{ insertText: { location: { index: 1 }, text: params.content } }],
        }),
      }
    );
    if (!updateRes.ok) {
      return `Document created but content insertion failed: ${await updateRes.text()}`;
    }
  }

  return JSON.stringify({
    documentId: doc.documentId,
    title: params.title,
    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
  });
}

async function updateGoogleDoc(
  token: string,
  params: { document_id: string; content: string; mode?: "append" | "replace" }
): Promise<string> {
  const id = extractGoogleId(params.document_id);
  const mode = params.mode ?? "append";

  // Fetch current doc to get end index
  const docRes = await fetch(`https://docs.googleapis.com/v1/documents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!docRes.ok) return `Error reading document: ${await docRes.text()}`;

  const doc = (await docRes.json()) as {
    body?: { content?: Array<{ endIndex?: number }> };
  };

  const content = doc.body?.content ?? [];
  const lastEndIndex = content[content.length - 1]?.endIndex ?? 1;

  const requests: unknown[] = [];

  if (mode === "replace" && lastEndIndex > 1) {
    requests.push({
      deleteContentRange: { range: { startIndex: 1, endIndex: lastEndIndex - 1 } },
    });
    requests.push({ insertText: { location: { index: 1 }, text: params.content } });
  } else {
    // append: insert before the final newline
    const insertAt = Math.max(lastEndIndex - 1, 1);
    requests.push({ insertText: { location: { index: insertAt }, text: "\n" + params.content } });
  }

  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${id}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests }),
    }
  );
  if (!updateRes.ok) return `Error updating document: ${await updateRes.text()}`;

  return JSON.stringify({
    ok: true,
    url: `https://docs.google.com/document/d/${id}/edit`,
    mode,
  });
}

async function createGoogleSheet(
  token: string,
  params: { title: string; headers?: string[]; rows?: string[][] }
): Promise<string> {
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties: { title: params.title } }),
  });
  if (!createRes.ok) return `Error creating spreadsheet: ${await createRes.text()}`;

  const sheet = (await createRes.json()) as { spreadsheetId: string };

  // Write initial data if provided
  if (params.headers && params.headers.length > 0) {
    const values = [params.headers, ...(params.rows ?? [])];
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }
    );
  }

  return JSON.stringify({
    spreadsheetId: sheet.spreadsheetId,
    title: params.title,
    url: `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`,
  });
}

async function updateGoogleSheet(
  token: string,
  params: {
    spreadsheet_id: string;
    sheet_name: string;
    rows: string[][];
    mode?: "append" | "overwrite";
  }
): Promise<string> {
  const id = extractGoogleId(params.spreadsheet_id);
  const mode = params.mode ?? "append";
  const range = encodeURIComponent(params.sheet_name);

  if (mode === "append") {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: params.rows }),
      }
    );
    if (!res.ok) return `Error appending to sheet: ${await res.text()}`;
  } else {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: params.rows }),
      }
    );
    if (!res.ok) return `Error overwriting sheet: ${await res.text()}`;
  }

  return JSON.stringify({
    ok: true,
    url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
    mode,
    rowsWritten: params.rows.length,
  });
}

// ── A1 range parser (for chart data ranges) ───────────────────────────────────

function colToIndex(col: string): number {
  let idx = 0;
  for (const c of col.toUpperCase()) {
    idx = idx * 26 + (c.charCodeAt(0) - 64);
  }
  return idx - 1;
}

function parseA1Range(range: string, sheetId: number) {
  const m = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!m) throw new Error(`Invalid A1 range: ${range}`);
  return {
    sheetId,
    startRowIndex: parseInt(m[2], 10) - 1,
    endRowIndex: parseInt(m[4], 10),
    startColumnIndex: colToIndex(m[1]),
    endColumnIndex: colToIndex(m[3]) + 1,
  };
}

// ── Chart creation ────────────────────────────────────────────────────────────

async function addChartToSheet(
  token: string,
  params: {
    spreadsheet_id: string;
    sheet_name?: string;
    chart_type: "COLUMN" | "BAR" | "LINE" | "AREA" | "PIE";
    title?: string;
    domain_range: string;   // A1 range for categories/labels, e.g. "A2:A10"
    series_ranges: string[]; // A1 ranges for data series, e.g. ["B2:B10", "C2:C10"]
  }
): Promise<string> {
  const id = extractGoogleId(params.spreadsheet_id);

  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) return `Error reading spreadsheet: ${await metaRes.text()}`;

  const meta = (await metaRes.json()) as {
    sheets?: Array<{ properties?: { title?: string; sheetId?: number } }>;
  };

  const sheetName = params.sheet_name ?? meta.sheets?.[0]?.properties?.title ?? "Sheet1";
  const sheetObj = meta.sheets?.find((s) => s.properties?.title === sheetName);
  const sheetId = sheetObj?.properties?.sheetId ?? 0;

  let chartSpec: unknown;
  if (params.chart_type === "PIE") {
    chartSpec = {
      title: params.title ?? "",
      pieChart: {
        legendPosition: "RIGHT_LEGEND",
        domain: { sourceRange: { sources: [parseA1Range(params.domain_range, sheetId)] } },
        series: { sourceRange: { sources: [parseA1Range(params.series_ranges[0], sheetId)] } },
      },
    };
  } else {
    chartSpec = {
      title: params.title ?? "",
      basicChart: {
        chartType: params.chart_type,
        legendPosition: "BOTTOM_LEGEND",
        headerCount: 1,
        axis: [
          { position: "BOTTOM_AXIS", title: "" },
          { position: "LEFT_AXIS", title: "" },
        ],
        domains: [
          { domain: { sourceRange: { sources: [parseA1Range(params.domain_range, sheetId)] } } },
        ],
        series: params.series_ranges.map((range) => ({
          series: { sourceRange: { sources: [parseA1Range(range, sheetId)] } },
          targetAxis: "LEFT_AXIS",
        })),
      },
    };
  }

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            addChart: {
              chart: {
                spec: chartSpec,
                position: {
                  overlayPosition: {
                    anchorCell: { sheetId, rowIndex: 0, columnIndex: 0 },
                    widthPixels: 600,
                    heightPixels: 400,
                  },
                },
              },
            },
          },
        ],
      }),
    }
  );

  if (!batchRes.ok) return `Error creating chart: ${await batchRes.text()}`;

  const result = (await batchRes.json()) as {
    replies?: Array<{ addChart?: { chart?: { chartId?: number } } }>;
  };

  const chartId = result.replies?.[0]?.addChart?.chart?.chartId;
  if (chartId === undefined) return "Chart created but chartId not returned";

  return JSON.stringify({
    ok: true,
    chartId,
    spreadsheetId: id,
    url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
  });
}

async function updateGoogleSlides(
  token: string,
  params: {
    presentation_id: string;
    slides: Array<{
      title?: string;
      body?: string;
      notes?: string;
      layout_name?: string;
      chart?: { spreadsheet_id: string; chart_id: number };
    }>;
    keep_first?: number;
    keep_last?: number;
  }
): Promise<string> {
  const id = extractGoogleId(params.presentation_id);
  const keepFirst = params.keep_first ?? 1;
  const keepLast = params.keep_last ?? 1;

  // Fetch current presentation
  const presRes = await fetch(`https://slides.googleapis.com/v1/presentations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!presRes.ok) return `Error reading presentation: ${await presRes.text()}`;

  const pres = (await presRes.json()) as {
    slides?: Array<{ objectId: string }>;
    layouts?: Array<{
      objectId: string;
      layoutProperties?: { displayName?: string };
      pageElements?: Array<{
        shape?: { placeholder?: { type?: string } };
      }>;
    }>;
  };

  const currentSlides = pres.slides ?? [];

  // Discover layouts → { name: { id, placeholders } }
  const layouts: Record<string, { id: string; placeholders: string[] }> = {};
  for (const layout of pres.layouts ?? []) {
    const name = layout.layoutProperties?.displayName ?? "";
    const placeholders: string[] = [];
    for (const el of layout.pageElements ?? []) {
      const phType = el.shape?.placeholder?.type;
      if (phType && phType !== "SLIDE_NUMBER") placeholders.push(phType);
    }
    layouts[name] = { id: layout.objectId, placeholders };
  }

  const defaultLayout =
    layouts["Title and body"]?.id ??
    layouts["TITLE_AND_BODY"]?.id ??
    Object.values(layouts)[0]?.id ?? "";

  // Phase 1: delete middle slides + create new ones
  const requests: unknown[] = [];
  let deleteCount = 0;

  for (let i = keepFirst; i < currentSlides.length - keepLast; i++) {
    requests.push({ deleteObject: { objectId: currentSlides[i].objectId } });
    deleteCount++;
  }

  const slideIds: Array<{ slideId: string; hasNotes: boolean; notes: string }> = [];

  for (const [i, slideSpec] of params.slides.entries()) {
    const sid = `ns_${uid()}`;
    const tid = `nt_${uid()}`;
    const bid = `nb_${uid()}`;

    const layoutName = slideSpec.layout_name ?? "Title and body";
    const layoutInfo = layouts[layoutName] ?? { id: defaultLayout, placeholders: ["TITLE", "BODY"] };
    const availablePh = layoutInfo.placeholders;
    const hasTitle = availablePh.includes("TITLE");
    const hasBody = availablePh.includes("BODY");

    const mappings: unknown[] = [];
    if (hasTitle) mappings.push({ layoutPlaceholder: { type: "TITLE", index: 0 }, objectId: tid });
    if (hasBody) mappings.push({ layoutPlaceholder: { type: "BODY", index: 0 }, objectId: bid });

    requests.push({
      createSlide: {
        objectId: sid,
        insertionIndex: keepFirst + i,
        slideLayoutReference: { layoutId: layoutInfo.id },
        placeholderIdMappings: mappings,
      },
    });

    if (slideSpec.title && hasTitle) {
      requests.push({ insertText: { objectId: tid, text: slideSpec.title, insertionIndex: 0 } });
    }
    if (slideSpec.body && hasBody) {
      requests.push({ insertText: { objectId: bid, text: slideSpec.body, insertionIndex: 0 } });
    }

    // Embed a linked Sheets chart onto this slide
    if (slideSpec.chart) {
      requests.push({
        createSheetsChart: {
          objectId: `nc_${uid()}`,
          spreadsheetId: extractGoogleId(slideSpec.chart.spreadsheet_id),
          chartId: slideSpec.chart.chart_id,
          linkingMode: "LINKED",
          elementProperties: {
            pageObjectId: sid,
            // Center a large chart; slides are 9144000 × 5143500 EMU
            size: {
              width: { magnitude: 7200000, unit: "EMU" },
              height: { magnitude: 3500000, unit: "EMU" },
            },
            transform: {
              scaleX: 1, scaleY: 1,
              translateX: 972000,
              translateY: 1300000,
              unit: "EMU",
            },
          },
        },
      });
    }

    slideIds.push({ slideId: sid, hasNotes: !!slideSpec.notes, notes: slideSpec.notes ?? "" });
  }

  if (requests.length > 0) {
    const batchRes = await fetch(
      `https://slides.googleapis.com/v1/presentations/${id}:batchUpdate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      }
    );
    if (!batchRes.ok) return `Error updating slides: ${await batchRes.text()}`;
  }

  // Phase 2: add speaker notes (need to re-fetch to get notes shape IDs)
  const withNotes = slideIds.filter((s) => s.hasNotes);
  if (withNotes.length > 0) {
    const repres = await fetch(`https://slides.googleapis.com/v1/presentations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!repres.ok) return `Slides created but failed to add notes: ${await repres.text()}`;

    const updated = (await repres.json()) as {
      slides?: Array<{
        objectId: string;
        slideProperties?: {
          notesPage?: {
            pageElements?: Array<{
              objectId: string;
              shape?: { placeholder?: { type?: string }; text?: { textElements?: unknown[] } };
            }>;
          };
        };
      }>;
    };

    const notesRequests: unknown[] = [];
    for (const meta of withNotes) {
      const slide = updated.slides?.find((s) => s.objectId === meta.slideId);
      if (!slide) continue;
      for (const el of slide.slideProperties?.notesPage?.pageElements ?? []) {
        if (el.shape?.placeholder?.type === "BODY") {
          if (el.shape.text?.textElements?.length) {
            notesRequests.push({ deleteText: { objectId: el.objectId, textRange: { type: "ALL" } } });
          }
          notesRequests.push({ insertText: { objectId: el.objectId, text: meta.notes, insertionIndex: 0 } });
          break;
        }
      }
    }

    if (notesRequests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${id}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests: notesRequests }),
      });
    }
  }

  return JSON.stringify({
    ok: true,
    url: `https://docs.google.com/presentation/d/${id}/edit`,
    deleted: deleteCount,
    created: params.slides.length,
    notesAdded: withNotes.length,
  });
}

// ── Calendar handlers ─────────────────────────────────────────────────────────

async function listCalendars(token: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return `Error listing calendars: ${await res.text()}`;
  const data = (await res.json()) as {
    items?: Array<{ id: string; summary: string; primary?: boolean; accessRole?: string }>;
  };
  const items = data.items ?? [];
  return JSON.stringify(
    items.map((c) => ({ id: c.id, name: c.summary, primary: c.primary ?? false, role: c.accessRole })),
    null,
    2
  );
}

async function listCalendarEvents(
  token: string,
  params: {
    calendar_id?: string;
    time_min?: string;
    time_max?: string;
    max_results?: number;
    query?: string;
  }
): Promise<string> {
  const calId = encodeURIComponent(params.calendar_id ?? "primary");
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`);
  if (params.time_min) url.searchParams.set("timeMin", params.time_min);
  if (params.time_max) url.searchParams.set("timeMax", params.time_max);
  url.searchParams.set("maxResults", String(Math.min(params.max_results ?? 50, 250)));
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  if (params.query) url.searchParams.set("q", params.query);

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return `Error listing events: ${await res.text()}`;
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
      htmlLink?: string;
    }>;
  };
  const events = data.items ?? [];
  if (events.length === 0) return "No events found in the specified range.";
  return JSON.stringify(
    events.map((e) => ({
      id: e.id,
      title: e.summary ?? "(no title)",
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      location: e.location,
      description: e.description,
      attendees: e.attendees?.map((a) => ({ email: a.email, name: a.displayName, status: a.responseStatus })),
      url: e.htmlLink,
    })),
    null,
    2
  );
}

async function createCalendarEvent(
  token: string,
  params: {
    calendar_id?: string;
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
  }
): Promise<string> {
  const calId = encodeURIComponent(params.calendar_id ?? "primary");
  const body: Record<string, unknown> = {
    summary: params.title,
    start: { dateTime: params.start },
    end: { dateTime: params.end },
  };
  if (params.description) body.description = params.description;
  if (params.location) body.location = params.location;
  if (params.attendees?.length) {
    body.attendees = params.attendees.map((email) => ({ email }));
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events?sendUpdates=all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return `Error creating event: ${await res.text()}`;
  const event = (await res.json()) as { id: string; htmlLink?: string };
  return JSON.stringify({ ok: true, eventId: event.id, url: event.htmlLink });
}

async function updateCalendarEvent(
  token: string,
  params: {
    calendar_id?: string;
    event_id: string;
    title?: string;
    start?: string;
    end?: string;
    description?: string;
    location?: string;
    attendees?: string[];
  }
): Promise<string> {
  const calId = encodeURIComponent(params.calendar_id ?? "primary");
  const eventId = encodeURIComponent(params.event_id);

  // Fetch existing event first to do a patch
  const getRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!getRes.ok) return `Error fetching event: ${await getRes.text()}`;
  const existing = (await getRes.json()) as Record<string, unknown>;

  const patch: Record<string, unknown> = { ...existing };
  if (params.title) patch.summary = params.title;
  if (params.start) patch.start = { dateTime: params.start };
  if (params.end) patch.end = { dateTime: params.end };
  if (params.description !== undefined) patch.description = params.description;
  if (params.location !== undefined) patch.location = params.location;
  if (params.attendees) patch.attendees = params.attendees.map((email) => ({ email }));

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}?sendUpdates=all`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) return `Error updating event: ${await res.text()}`;
  const event = (await res.json()) as { id: string; htmlLink?: string };
  return JSON.stringify({ ok: true, eventId: event.id, url: event.htmlLink });
}

async function deleteCalendarEvent(
  token: string,
  params: { calendar_id?: string; event_id: string }
): Promise<string> {
  const calId = encodeURIComponent(params.calendar_id ?? "primary");
  const eventId = encodeURIComponent(params.event_id);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok && res.status !== 204) return `Error deleting event: ${await res.text()}`;
  return JSON.stringify({ ok: true });
}

// ── Tool definitions ──────────────────────────────────────────────────────────

export const googleToolDefinitions: ToolDefinition[] = [
  {
    name: "list_drive_files",
    description: "Search or list files in the user's Google Drive. Returns file names, IDs, types, and URLs.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term to filter by file name" },
        mime_type: {
          type: "string",
          description: "Filter by MIME type, e.g. 'application/vnd.google-apps.spreadsheet'",
        },
        max_results: { type: "number", description: "Maximum number of results (default: 20, max: 50)" },
      },
    },
  },
  {
    name: "read_google_doc",
    description: "Read the text content of a Google Doc. Accepts a document URL or ID.",
    input_schema: {
      type: "object",
      properties: {
        document_id: { type: "string", description: "Google Doc URL or document ID" },
      },
      required: ["document_id"],
    },
  },
  {
    name: "read_google_sheet",
    description:
      "Read rows from a Google Sheet. Returns data as JSON with all available tab names listed. Accepts a spreadsheet URL or ID. Use sheet_name to target a specific tab, range for an A1-notation cell range, or max_rows to limit large sheets.",
    input_schema: {
      type: "object",
      properties: {
        spreadsheet_id: { type: "string", description: "Google Sheets URL or spreadsheet ID" },
        sheet_name: {
          type: "string",
          description: "Name of the tab to read (defaults to first tab). The response always lists all available tabs.",
        },
        range: {
          type: "string",
          description: "A1-notation range within the sheet, e.g. 'A1:D50'. Applied after sheet_name.",
        },
        max_rows: {
          type: "number",
          description: "Maximum number of data rows to return (excludes header row). Useful for large sheets.",
        },
      },
      required: ["spreadsheet_id"],
    },
  },
  {
    name: "read_google_slides",
    description: "Read the text content and speaker notes from a Google Slides presentation.",
    input_schema: {
      type: "object",
      properties: {
        presentation_id: { type: "string", description: "Google Slides URL or presentation ID" },
      },
      required: ["presentation_id"],
    },
  },
  {
    name: "create_google_doc",
    description: "Create a new Google Doc with an optional initial content body.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Document title" },
        content: { type: "string", description: "Initial text content (plain text or markdown-like)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_google_doc",
    description: "Update an existing Google Doc by appending content or replacing all content.",
    input_schema: {
      type: "object",
      properties: {
        document_id: { type: "string", description: "Google Doc URL or document ID" },
        content: { type: "string", description: "Text to insert" },
        mode: {
          type: "string",
          enum: ["append", "replace"],
          description: "append (default) adds to end; replace clears and rewrites the document",
        },
      },
      required: ["document_id", "content"],
    },
  },
  {
    name: "create_google_sheet",
    description: "Create a new Google Sheet with optional initial headers and rows.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Spreadsheet title" },
        headers: {
          type: "array",
          items: { type: "string" },
          description: "Column headers for the first row",
        },
        rows: {
          type: "array",
          items: { type: "array", items: { type: "string" } },
          description: "Data rows (array of arrays)",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_google_sheet",
    description: "Write rows to an existing Google Sheet by appending or overwriting.",
    input_schema: {
      type: "object",
      properties: {
        spreadsheet_id: { type: "string", description: "Google Sheets URL or spreadsheet ID" },
        sheet_name: { type: "string", description: "Name of the tab to write to" },
        rows: {
          type: "array",
          items: { type: "array", items: { type: "string" } },
          description: "Rows to write (array of arrays)",
        },
        mode: {
          type: "string",
          enum: ["append", "overwrite"],
          description: "append (default) adds rows; overwrite replaces all existing data",
        },
      },
      required: ["spreadsheet_id", "sheet_name", "rows"],
    },
  },
  {
    name: "add_chart_to_sheet",
    description:
      "Create a chart inside a Google Sheet and return its chartId. Use the chartId with update_google_slides to embed the chart in a presentation slide.",
    input_schema: {
      type: "object",
      properties: {
        spreadsheet_id: { type: "string", description: "Google Sheets URL or spreadsheet ID" },
        sheet_name: { type: "string", description: "Tab name (defaults to first sheet)" },
        chart_type: {
          type: "string",
          enum: ["COLUMN", "BAR", "LINE", "AREA", "PIE"],
          description: "Chart type",
        },
        title: { type: "string", description: "Chart title" },
        domain_range: {
          type: "string",
          description: "A1 range for the category/label column, e.g. 'A2:A10'",
        },
        series_ranges: {
          type: "array",
          items: { type: "string" },
          description: "A1 ranges for data series, e.g. ['B2:B10', 'C2:C10']",
        },
      },
      required: ["spreadsheet_id", "chart_type", "domain_range", "series_ranges"],
    },
  },
  {
    name: "list_calendars",
    description: "List all Google Calendars the user has access to. Call this first if the user hasn't specified which calendar to use.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_calendar_events",
    description: "Get events from a Google Calendar within a date range.",
    input_schema: {
      type: "object",
      properties: {
        calendar_id: { type: "string", description: "Calendar ID (use 'primary' for the user's main calendar)" },
        time_min: { type: "string", description: "Start of range, RFC 3339 format e.g. '2026-03-09T00:00:00-07:00'" },
        time_max: { type: "string", description: "End of range, RFC 3339 format" },
        max_results: { type: "number", description: "Max events to return (default 50, max 250)" },
        query: { type: "string", description: "Free-text search within event fields" },
      },
    },
  },
  {
    name: "create_calendar_event",
    description: "Create a new Google Calendar event. Times must be RFC 3339. Pass attendees as email strings to send invites.",
    input_schema: {
      type: "object",
      properties: {
        calendar_id: { type: "string", description: "Calendar ID (default: 'primary')" },
        title: { type: "string", description: "Event title" },
        start: { type: "string", description: "Start time, RFC 3339 e.g. '2026-03-10T14:00:00-07:00'" },
        end: { type: "string", description: "End time, RFC 3339" },
        description: { type: "string", description: "Event description/body" },
        location: { type: "string", description: "Event location" },
        attendees: { type: "array", items: { type: "string" }, description: "Email addresses to invite" },
      },
      required: ["title", "start", "end"],
    },
  },
  {
    name: "update_calendar_event",
    description: "Update an existing Google Calendar event. Provide only the fields to change.",
    input_schema: {
      type: "object",
      properties: {
        calendar_id: { type: "string", description: "Calendar ID (default: 'primary')" },
        event_id: { type: "string", description: "Event ID from list_calendar_events" },
        title: { type: "string", description: "New event title" },
        start: { type: "string", description: "New start time, RFC 3339" },
        end: { type: "string", description: "New end time, RFC 3339" },
        description: { type: "string", description: "New description" },
        location: { type: "string", description: "New location" },
        attendees: { type: "array", items: { type: "string" }, description: "Updated attendee email list" },
      },
      required: ["event_id"],
    },
  },
  {
    name: "delete_calendar_event",
    description: "Delete a Google Calendar event.",
    input_schema: {
      type: "object",
      properties: {
        calendar_id: { type: "string", description: "Calendar ID (default: 'primary')" },
        event_id: { type: "string", description: "Event ID from list_calendar_events" },
      },
      required: ["event_id"],
    },
  },
  {
    name: "update_google_slides",
    description:
      "Update a Google Slides presentation by replacing content slides. Preserves the first N and last N slides, deletes slides in between, then creates new ones from a spec. Slides may optionally embed a linked Sheets chart.",
    input_schema: {
      type: "object",
      properties: {
        presentation_id: { type: "string", description: "Google Slides URL or presentation ID" },
        slides: {
          type: "array",
          description: "New slides to create",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Slide title" },
              body: { type: "string", description: "Slide body text" },
              notes: { type: "string", description: "Speaker notes" },
              layout_name: {
                type: "string",
                description: "Layout name from the presentation (e.g. 'Title and body')",
              },
              chart: {
                type: "object",
                description: "Embed a Sheets chart on this slide. Provide the spreadsheet ID and chartId returned by add_chart_to_sheet.",
                properties: {
                  spreadsheet_id: { type: "string", description: "Spreadsheet URL or ID containing the chart" },
                  chart_id: { type: "number", description: "chartId returned by add_chart_to_sheet" },
                },
                required: ["spreadsheet_id", "chart_id"],
              },
            },
          },
        },
        keep_first: {
          type: "number",
          description: "Number of slides to keep at the start (default: 1)",
        },
        keep_last: {
          type: "number",
          description: "Number of slides to keep at the end (default: 1)",
        },
      },
      required: ["presentation_id", "slides"],
    },
  },
];

export const googleToolNames = new Set(googleToolDefinitions.map((t) => t.name));

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function executeGoogleTool(
  _userId: string,
  call: ToolCall,
  credProvider: CredentialProvider
): Promise<string> {
  let token: string;
  try {
    token = await getGoogleTokenFromProvider(credProvider);
  } catch (err) {
    return `Google Drive is not connected or the token has expired. Run \`npm run setup\` to reconnect.`;
  }

  logger.debug("google", `tool: ${call.name}(${JSON.stringify(call.input).slice(0, 100)})`);

  try {
    switch (call.name) {
      case "list_drive_files":
        return await listDriveFiles(token, call.input as Parameters<typeof listDriveFiles>[1]);
      case "read_google_doc":
        return await readGoogleDoc(token, call.input as Parameters<typeof readGoogleDoc>[1]);
      case "read_google_sheet":
        return await readGoogleSheet(token, call.input as Parameters<typeof readGoogleSheet>[1]);
      case "read_google_slides":
        return await readGoogleSlides(token, call.input as Parameters<typeof readGoogleSlides>[1]);
      case "create_google_doc":
        return await createGoogleDoc(token, call.input as Parameters<typeof createGoogleDoc>[1]);
      case "update_google_doc":
        return await updateGoogleDoc(token, call.input as Parameters<typeof updateGoogleDoc>[1]);
      case "create_google_sheet":
        return await createGoogleSheet(token, call.input as Parameters<typeof createGoogleSheet>[1]);
      case "update_google_sheet":
        return await updateGoogleSheet(token, call.input as Parameters<typeof updateGoogleSheet>[1]);
      case "add_chart_to_sheet":
        return await addChartToSheet(token, call.input as Parameters<typeof addChartToSheet>[1]);
      case "update_google_slides":
        return await updateGoogleSlides(token, call.input as Parameters<typeof updateGoogleSlides>[1]);
      case "list_calendars":
        return await listCalendars(token);
      case "list_calendar_events":
        return await listCalendarEvents(token, call.input as Parameters<typeof listCalendarEvents>[1]);
      case "create_calendar_event":
        return await createCalendarEvent(token, call.input as Parameters<typeof createCalendarEvent>[1]);
      case "update_calendar_event":
        return await updateCalendarEvent(token, call.input as Parameters<typeof updateCalendarEvent>[1]);
      case "delete_calendar_event":
        return await deleteCalendarEvent(token, call.input as Parameters<typeof deleteCalendarEvent>[1]);
      default:
        return `Unknown Google tool: ${call.name}`;
    }
  } catch (err) {
    logger.error("google", `tool error: ${call.name}`, err);
    return `Error executing ${call.name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
