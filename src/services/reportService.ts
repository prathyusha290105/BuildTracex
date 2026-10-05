import { supabase } from '@/lib/supabase';
import {
  DashboardMetrics,
  ContractorPerformanceMetric,
  Defect,
  Inspection,
  DefectStatus,
  DefectSeverity,
} from '@/types';
import { calculateAgeingDays, getAgeingBracket, isDefectOverdue, formatStatusLabel, formatSeverityLabel, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const reportService = {
  async getDashboardMetrics(projectId?: string): Promise<DashboardMetrics> {
    let inspQuery = supabase.from('inspections').select('id, status', { count: 'exact' });
    let defectQuery = supabase.from('defects').select('id, status, severity, due_date, created_at, closed_at');

    if (projectId && projectId !== 'all') {
      inspQuery = inspQuery.eq('project_id', projectId);
      defectQuery = defectQuery.eq('project_id', projectId);
    }

    const [{ count: totalInspections }, { data: defects, error: defectError }] = await Promise.all([
      inspQuery,
      defectQuery,
    ]);

    if (defectError) {
      console.warn('Error fetching defect metrics:', defectError.message);
    }

    const defectList = defects || [];

    const byStatus: Record<DefectStatus, number> = {
      open: 0,
      assigned: 0,
      rectification_in_progress: 0,
      rectification_submitted: 0,
      awaiting_reinspection: 0,
      closed: 0,
      rejected: 0,
      reopened: 0,
    };

    const bySeverity: Record<DefectSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const ageing = {
      '0-3': 0,
      '4-7': 0,
      '8-14': 0,
      '15-30': 0,
      '30+': 0,
    };

    let overdueCount = 0;
    let openCount = 0;
    let awaitingReinspectionCount = 0;
    let closedCount = 0;

    defectList.forEach((d) => {
      // By status
      if (byStatus[d.status as DefectStatus] !== undefined) {
        byStatus[d.status as DefectStatus]++;
      }

      // By severity
      if (bySeverity[d.severity as DefectSeverity] !== undefined) {
        bySeverity[d.severity as DefectSeverity]++;
      }

      // Open count
      if (d.status !== 'closed') {
        openCount++;
      } else {
        closedCount++;
      }

      // Awaiting reinspection
      if (d.status === 'awaiting_reinspection' || d.status === 'rectification_submitted') {
        awaitingReinspectionCount++;
      }

      // Overdue
      if (isDefectOverdue(d.status as DefectStatus, d.due_date)) {
        overdueCount++;
      }

      // Ageing (for unclosed or at time of closure)
      const ageDays = calculateAgeingDays(d.created_at, d.closed_at);
      const bracket = getAgeingBracket(ageDays);
      ageing[bracket]++;
    });

    return {
      totalInspections: totalInspections || 0,
      totalDefects: defectList.length,
      openDefects: openCount,
      overdueDefects: overdueCount,
      awaitingReinspection: awaitingReinspectionCount,
      closedDefects: closedCount,
      byStatus,
      bySeverity,
      ageing,
    };
  },

  async getContractorPerformanceMetrics(projectId?: string): Promise<ContractorPerformanceMetric[]> {
    const { data: contractors } = await supabase
      .from('contractors')
      .select('id, company_name')
      .eq('is_active', true);

    if (!contractors || contractors.length === 0) return [];

    let defectQuery = supabase
      .from('defects')
      .select('id, contractor_id, status, due_date, created_at, closed_at');

    if (projectId && projectId !== 'all') {
      defectQuery = defectQuery.eq('project_id', projectId);
    }

    const { data: defects } = await defectQuery;
    const defectList = defects || [];

    // Also fetch rejected reinspections count for each contractor
    const { data: rejectedReinspections } = await supabase
      .from('reinspections')
      .select('defect_id')
      .eq('outcome', 'rejected');

    const rejectedDefectIds = new Set((rejectedReinspections || []).map((r) => r.defect_id));

    return contractors.map((c) => {
      const assigned = defectList.filter((d) => d.contractor_id === c.id);
      const closed = assigned.filter((d) => d.status === 'closed');
      const overdue = assigned.filter((d) => isDefectOverdue(d.status as DefectStatus, d.due_date));
      const rejectedCount = assigned.filter((d) => rejectedDefectIds.has(d.id)).length;

      // Closure rate calculation
      const closureRate = assigned.length > 0 ? Math.round((closed.length / assigned.length) * 100) : 0;

      // Avg closure days
      const closureDays = closed
        .map((d) => calculateAgeingDays(d.created_at, d.closed_at))
        .filter((days) => days > 0);
      const avgDays = closureDays.length > 0
        ? Math.round((closureDays.reduce((a, b) => a + b, 0) / closureDays.length) * 10) / 10
        : 0;

      return {
        contractorId: c.id,
        contractorName: c.company_name,
        totalAssigned: assigned.length,
        closed: closed.length,
        overdue: overdue.length,
        rejectedRectifications: rejectedCount,
        closureRate,
        avgClosureDays: avgDays,
      };
    });
  },

  // Real PDF Generation for Inspections
  generateInspectionPDF(inspection: Inspection) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42]; // deep navy

    // Header Title
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BUILDTRACEX QUALITY INSPECTION REPORT', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reference: ${inspection.reference || 'N/A'}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 25);

    // Meta details block
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Overview', 14, 38);

    const metaData = [
      ['Project:', inspection.project?.name || 'Northstar Residential Block A', 'Inspection Date:', formatDate(inspection.inspection_date)],
      ['Location:', `${inspection.building?.name || ''} - ${inspection.floor?.name || ''} - ${inspection.zone?.name || ''}`, 'Status:', inspection.status.toUpperCase()],
      ['Template:', inspection.template_name_snapshot, 'Inspector:', inspection.inspector?.full_name || 'QA Engineer'],
    ];

    autoTable(doc, {
      startY: 42,
      body: metaData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 75 },
        2: { fontStyle: 'bold', cellWidth: 30 },
        3: { cellWidth: 50 },
      },
    });

    // Checklist responses table
    const currentY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Checklist Evaluation Results', 14, currentY);

    const checklistRows = (inspection.responses || []).map((resp, i) => [
      String(i + 1),
      resp.item_title_snapshot,
      resp.response ? resp.response.toUpperCase() : 'PENDING',
      resp.remarks || '—',
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['#', 'Checklist Item', 'Result', 'Remarks / Observations']],
      body: checklistRows.length > 0 ? checklistRows : [['-', 'No checklist responses recorded', '-', '-']],
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 70 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'PASS') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'FAIL') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // Linked defects section
    const defectsY = (doc as any).lastAutoTable.finalY + 8;
    if (defectsY < 240) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Defects Generated from Inspection', 14, defectsY);

      const defectRows = (inspection.defects || []).map((d: any) => [
        d.reference || 'N/A',
        d.title,
        formatSeverityLabel(d.severity),
        formatStatusLabel(d.status),
        d.contractor?.company_name || 'Unassigned',
      ]);

      autoTable(doc, {
        startY: defectsY + 4,
        head: [['Defect ID', 'Title', 'Severity', 'Status', 'Assigned Contractor']],
        body: defectRows.length > 0 ? defectRows : [['—', 'No defects linked to this inspection', '—', '—', '—']],
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`BuildTracex Quality Management Platform  |  Page ${i} of ${pageCount}`, 14, 290);
    }

    if (typeof window !== 'undefined') {
      try {
        doc.save(`Inspection_${inspection.reference || 'Report'}.pdf`);
      } catch (err) {
        console.warn('PDF save skipped in non-browser context:', err);
      }
    }
    return doc;
  },

  // Real PDF Generation for Defect Dossier
  generateDefectPDF(defect: Defect) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`DEFECT DOSSIER: ${defect.reference}`, 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Severity: ${formatSeverityLabel(defect.severity).toUpperCase()}  |  Status: ${formatStatusLabel(defect.status).toUpperCase()}  |  Date: ${new Date().toLocaleDateString()}`, 14, 25);

    // Summary Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Defect Information & Location', 14, 38);

    const infoRows = [
      ['Title:', defect.title, 'Category:', defect.category || 'General Finishes'],
      ['Project:', defect.project?.name || 'N/A', 'Reported By:', defect.reporter?.full_name || 'QA Engineer'],
      ['Location:', `${defect.building?.name || ''} > ${defect.floor?.name || ''} > ${defect.zone?.name || ''}`, 'Created Date:', formatDate(defect.created_at)],
      ['Contractor:', defect.contractor?.company_name || 'Unassigned', 'Due Date:', formatDate(defect.due_date)],
      ['Ageing:', `${calculateAgeingDays(defect.created_at, defect.closed_at)} days`, 'Overdue:', isDefectOverdue(defect.status, defect.due_date) ? 'YES' : 'NO'],
    ];

    autoTable(doc, {
      startY: 42,
      body: infoRows,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 75 },
        2: { fontStyle: 'bold', cellWidth: 26 },
        3: { cellWidth: 55 },
      },
    });

    // Description
    let nextY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Defect Description:', 14, nextY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitDesc = doc.splitTextToSize(defect.description || 'No detailed description provided.', 180);
    doc.text(splitDesc, 14, nextY + 5);

    nextY = nextY + 8 + splitDesc.length * 4;

    // Status History Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Chronological Status Audit Trail', 14, nextY);

    const historyRows = (defect.history || []).map((h) => [
      formatDate(h.created_at),
      h.changer?.full_name || 'System',
      h.previous_status ? formatStatusLabel(h.previous_status) : 'Initial',
      formatStatusLabel(h.new_status),
      h.reason || '—',
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Timestamp', 'Actor', 'From Status', 'To Status', 'Reason / Comments']],
      body: historyRows.length > 0 ? historyRows : [['—', '—', '—', formatStatusLabel(defect.status), 'Initial creation']],
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    // Rectification & Reinspection summaries
    nextY = (doc as any).lastAutoTable.finalY + 8;
    if (nextY < 230 && (defect.rectifications?.length || defect.reinspections?.length)) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Rectification & Verification History', 14, nextY);

      const workflowRows: string[][] = [];
      (defect.rectifications || []).forEach((r) => {
        workflowRows.push([
          formatDate(r.submitted_at),
          'Contractor Submission',
          r.submitter?.full_name || 'Contractor',
          r.description + (r.completion_summary ? `\nSummary: ${r.completion_summary}` : ''),
        ]);
      });
      (defect.reinspections || []).forEach((ri) => {
        workflowRows.push([
          formatDate(ri.reviewed_at),
          `Reinspection: ${ri.outcome.toUpperCase()}`,
          ri.reviewer?.full_name || 'QA Reviewer',
          ri.comments || '—',
        ]);
      });

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Date', 'Action Type', 'User', 'Details / Comments']],
        body: workflowRows,
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    // Page numbering
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`BuildTracex Quality Management Platform  |  Dossier ${defect.reference}  |  Page ${i} of ${totalPages}`, 14, 290);
    }

    if (typeof window !== 'undefined') {
      try {
        doc.save(`Defect_${defect.reference}.pdf`);
      } catch (err) {
        console.warn('PDF save skipped in non-browser context:', err);
      }
    }
    return doc;
  },

  // Real PDF Generation for Defect Register
  generateDefectRegisterPDF(defects: Defect[], filterSummary: string) {
    const doc = new jsPDF('landscape');
    const primaryColor: [number, number, number] = [15, 23, 42];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BUILDTRACEX DEFECT REGISTER REPORT', 14, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filter Scope: ${filterSummary}  |  Total Records: ${defects.length}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    const rows = defects.map((d) => [
      d.reference,
      d.title,
      d.project?.name || 'N/A',
      `${d.building?.name || ''} - ${d.floor?.name || ''}`,
      formatSeverityLabel(d.severity),
      formatStatusLabel(d.status),
      d.contractor?.company_name || 'Unassigned',
      formatDate(d.due_date),
      `${calculateAgeingDays(d.created_at, d.closed_at)}d`,
      isDefectOverdue(d.status, d.due_date) ? 'OVERDUE' : 'OK',
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Title', 'Project', 'Location', 'Severity', 'Status', 'Contractor', 'Due Date', 'Age', 'Alert']],
      body: rows.length > 0 ? rows : [['—', 'No defects matched the selected criteria', '—', '—', '—', '—', '—', '—', '—', '—']],
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 9 && data.cell.raw === 'OVERDUE') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`BuildTracex Quality Analytics  |  Page ${i} of ${totalPages}`, 14, 202);
    }

    if (typeof window !== 'undefined') {
      try {
        doc.save(`BuildTracex_Defect_Register_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err) {
        console.warn('PDF save skipped in non-browser context:', err);
      }
    }
    return doc;
  },
};
