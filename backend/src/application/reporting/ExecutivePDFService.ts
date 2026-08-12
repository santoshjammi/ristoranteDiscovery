// ── Executive PDF Service ──
// Generates a downloadable PDF that mirrors the Restaurant Details scorecard
// page: overall score, 5 categories, 25 factors with status, top problems,
// pending factors. Reuses the scorecard service — same data contract.

import PDFDocument from 'pdfkit';
import { getScorecard } from '../../domain/scorecard/ScorecardService';

// ── Colors ──
const C = {
  bg: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  text: '#f1f5f9',
  muted: '#94a3b8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  primary: '#3b82f6',
};

function statusColor(status: string): string {
  switch (status) {
    case 'excellent': return C.success;
    case 'good': return C.success;
    case 'fair': return C.warning;
    case 'needs_attention': return C.warning;
    case 'critical': return C.danger;
    default: return C.muted;
  }
}

/**
 * Generate the executive PDF for a restaurant as a Buffer.
 */
export async function generateExecutivePDF(restaurantId: string): Promise<Buffer> {
  const scorecard = await getScorecard(restaurantId, '');

  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));

  // ── Header ──
  doc.rect(0, 0, 595, 72).fill(C.bg);
  doc.fillColor(C.text).fontSize(18).font('Helvetica-Bold').text('Restaurant Intelligence Report', 48, 24);
  doc.fontSize(10).font('Helvetica').fillColor(C.muted).text(scorecard.restaurantName, 48, 46);
  doc.fontSize(9).fillColor(C.muted).text(new Date().toLocaleDateString(), 400, 46);

  // ── Overall score ──
  const overall = scorecard.overallScore;
  doc.y = 96;
  doc.rect(48, doc.y, 499, 60).fill(C.surface);
  doc.fillColor(C.text).fontSize(36).font('Helvetica-Bold').text(overall !== null ? String(overall) : '—', 60, doc.y + 8);
  doc.fillColor(C.muted).fontSize(14).font('Helvetica').text('/100', 100, doc.y + 20);
  const sc = statusColor(scorecard.overallStatus);
  doc.fillColor(sc).fontSize(11).font('Helvetica-Bold').text(scorecard.overallStatus.replace(/_/g, ' '), 130, doc.y + 16);
  doc.fillColor(C.muted).fontSize(9).font('Helvetica').text(`${scorecard.liveFactors} of ${scorecard.totalFactors} factors measured · ${scorecard.pendingFactors} pending`, 60, doc.y + 40);

  // ── Category scores ──
  doc.y += 84;
  doc.fillColor(C.text).fontSize(14).font('Helvetica-Bold').text('Category Scores', 48, doc.y);
  doc.y += 22;
  for (const cat of scorecard.categories) {
    const catScore = cat.score !== null ? String(cat.score) : '—';
    doc.fillColor(C.text).fontSize(11).font('Helvetica').text(cat.name, 48, doc.y);
    doc.fillColor(statusColor(cat.factors.find(f => f.status !== 'pending_observation')?.status || 'pending_observation'))
      .fontSize(11).font('Helvetica-Bold').text(catScore, 420, doc.y, { width: 80, align: 'right' });
    doc.fillColor(C.muted).fontSize(8).font('Helvetica').text(
      `${cat.healthyCount} healthy · ${cat.pendingCount} pending`,
      320, doc.y,
    );
    doc.y += 16;
  }

  // ── Factors table ──
  doc.moveDown().fillColor(C.text).fontSize(14).font('Helvetica-Bold').text('Factor Breakdown');
  doc.moveDown(0.5);
  const allFactors = scorecard.categories.flatMap(c => c.factors);
  const colX = [48, 200, 360, 420, 470];
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
  doc.text('Factor', colX[0], doc.y, { width: 140 });
  doc.text('Score', colX[3], doc.y, { width: 50, align: 'right' });
  doc.text('Status', colX[4], doc.y, { width: 80 });
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  for (const f of allFactors) {
    if (doc.y > 720) doc.addPage();
    doc.fillColor(C.text).text(f.name, colX[0], doc.y, { width: 150 });
    doc.fillColor(f.score !== null ? statusColor(f.status) : C.muted).font('Helvetica-Bold')
      .text(f.score !== null ? String(f.score) : '—', colX[3], doc.y, { width: 50, align: 'right' });
    doc.fillColor(f.score !== null ? statusColor(f.status) : C.muted).font('Helvetica')
      .text(f.status.replace(/_/g, ' '), colX[4], doc.y, { width: 80 });
    doc.moveDown(0.5);
  }

  // ── Top problems ──
  doc.moveDown().fillColor(C.danger).fontSize(13).font('Helvetica-Bold').text('Top Problem Factors');
  doc.moveDown(0.4);
  const problems = allFactors.filter(f => f.status === 'critical' || f.status === 'needs_attention')
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 5);
  doc.font('Helvetica').fontSize(9);
  for (const p of problems) {
    doc.fillColor(C.text).text(`• ${p.name} (${p.score ?? '—'}) — ${p.expectedImprovement}`, 48, doc.y, { width: 500 });
    doc.moveDown(0.4);
  }

  // ── Pending factors ──
  const pending = allFactors.filter(f => f.status === 'pending_observation');
  if (pending.length > 0) {
    doc.moveDown().fillColor(C.muted).fontSize(13).font('Helvetica-Bold').text('Pending Observation');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);
    for (const p of pending) {
      doc.fillColor(C.text).text(`• ${p.name}${p.connectorRequired ? ` — requires ${p.connectorRequired}` : ''}`, 48, doc.y, { width: 500 });
      doc.moveDown(0.4);
    }
  }

  // ── Footer ──
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fillColor(C.muted).fontSize(8).text(`Generated by Ristorante Discovery · Page ${i + 1} of ${pageCount}`, 48, 800);
  }

  doc.end();
  return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
}
