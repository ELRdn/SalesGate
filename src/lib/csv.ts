// CSVパース（リード一括投入用）
// 形式: 「会社名,担当者名,メールアドレス」または「会社名,メールアドレス」
// 1行目がヘッダー（company/会社/email/メール等を含む）の場合はスキップ

export interface CsvLeadRow {
  company: string;
  contactName?: string;
  email: string;
}

/** 引用符対応の簡易CSV行パーサ */
export function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cols.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

/** ヘッダー行かどうか（1列目がラベルっぽい場合）。
 * 前方一致にする理由: 「株式会社A」をヘッダーと誤判定しないため */
function isHeaderLine(cols: string[]): boolean {
  const first = cols[0]?.toLowerCase() ?? "";
  return (
    first.startsWith("company") ||
    first.startsWith("会社") ||
    first.startsWith("企業") ||
    first.startsWith("email") ||
    first.startsWith("メール") ||
    first.startsWith("担当") ||
    first.startsWith("contact") ||
    first.startsWith("名前")
  );
}

/** 複数行のCSVテキストをリード行の配列に変換 */
export function parseCsvLeads(raw: string): CsvLeadRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: CsvLeadRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length === 0) continue;
    if (i === 0 && isHeaderLine(cols)) continue;

    if (cols.length >= 3) {
      // 会社名,担当者名,メール
      rows.push({ company: cols[0], contactName: cols[1], email: cols[2] });
    } else if (cols.length === 2) {
      // 会社名,メール
      rows.push({ company: cols[0], email: cols[1] });
    }
  }
  return rows;
}
