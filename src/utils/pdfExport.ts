import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  StudentAbsenStatus,
  RiwayatSiswaReport,
  Siswa,
  AbsenRecord,
  KeteranganRecord,
  LogWARecord,
  RekapSiswaItem,
} from '../types';
import { loadSettings } from '../data/database';

export function formatTanggalPDF(value: string | undefined | null): string {
  const text = String(value || '').trim();
  if (!text) return '-';
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return text;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function drawSchoolHeader(doc: jsPDF, title: string, subtitle?: string) {
  const settings = loadSettings();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(settings.namaSekolah || 'SMA NEGERI 05 BOMBANA', pageWidth / 2, 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    settings.alamatSekolah || 'Jl. Pendidikan No. 05, Kabaena Timur, Bombana, Sulawesi Tenggara',
    pageWidth / 2,
    18,
    { align: 'center' }
  );

  doc.setDrawColor(160, 174, 192);
  doc.setLineWidth(0.5);
  doc.line(14, 21, pageWidth - 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), pageWidth / 2, 28, { align: 'center' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(subtitle, pageWidth / 2, 33, { align: 'center' });
  }
}

function drawSignatureBlock(doc: jsPDF, finalY: number) {
  const settings = loadSettings();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = finalY + 10;

  if (y + 36 > pageHeight) {
    doc.addPage();
    y = 20;
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  // Left signature
  doc.text('Mengetahui / Memverifikasi,', 20, y);
  doc.text(settings.defaultAdmin || 'Petugas Piket / BK', 20, y + 4.5);

  // Right signature
  const rightX = pageWidth - 75;
  doc.text(`Bombana, ${dateStr}`, rightX, y);
  doc.text('Kepala Sekolah,', rightX, y + 4.5);

  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(settings.defaultAdmin || 'Petugas Piket / BK', 20, y);

  doc.text(settings.kepalaSekolah || 'Drs. H. Sudirman, M.Pd.', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${settings.nipKepalaSekolah || '-'}`, rightX, y + 4);
}

export function downloadFilteredAbsensiPDF(
  students: StudentAbsenStatus[],
  selectedDate: string,
  filterInfo: {
    kelasLabel: string;
    statusLabel: string;
    searchLabel: string;
  }
) {
  if (!students || students.length === 0) {
    alert('Tidak ada data yang sesuai dengan filter saat ini.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DETAIL DATA ABSENSI SISWA', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(11);
  doc.text('SMA NEGERI 05 BOMBANA', pageWidth / 2, 20, { align: 'center' });

  // Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Tanggal: ${formatTanggalPDF(selectedDate)}`, 14, 28);
  doc.text(`Status: ${filterInfo.statusLabel}`, 14, 34);
  doc.text(`Kelas: ${filterInfo.kelasLabel}`, 95, 34);
  doc.text(`Pencarian: ${filterInfo.searchLabel || '-'}`, 175, 34);
  doc.text(`Jumlah: ${students.length} siswa`, pageWidth - 14, 34, { align: 'right' });

  const tableData = students.map((s, index) => [
    index + 1,
    String(s.nisn || '-'),
    String(s.nama || '-'),
    String(s.kelas || '-'),
    String(s.jamDatang || '-'),
    String(s.jamPulang || '-'),
    String(s.status || '-').toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['No', 'NISN', 'Nama Siswa', 'Kelas', 'Jam Datang', 'Jam Pulang', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.3, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 32 },
      2: { cellWidth: 68 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 30 },
      5: { halign: 'center', cellWidth: 30 },
      6: { halign: 'center', cellWidth: 48 },
    },
    didDrawPage: () => {
      const pageNumber = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Dicetak dari Dashboard Absensi Siswa - SMA Negeri 05 Bombana', 14, pageHeight - 8);
      doc.text(`Halaman ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  const statusClean = filterInfo.statusLabel.replace(/\s+/g, '_').replace(/[\/\\:*?"<>|]/g, '');
  const kelasClean = filterInfo.kelasLabel.replace(/\s+/g, '_').replace(/[\/\\:*?"<>|]/g, '');
  doc.save(`Detail_Absensi_${selectedDate}_${statusClean}_${kelasClean}.pdf`);
}

export function downloadRiwayatSiswaPDF(report: RiwayatSiswaReport) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RINCIAN RIWAYAT ABSENSI SISWA', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(11);
  doc.text('SMA NEGERI 05 BOMBANA', pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Periode Rekap: ${formatTanggalPDF(report.periodeMulai)} s.d. ${formatTanggalPDF(report.dibuatTanggal)}`,
    pageWidth / 2,
    26,
    { align: 'center' }
  );

  let y = 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('IDENTITAS SISWA', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.text('NISN', 14, y);
  doc.text(`: ${report.nisn || '-'}`, 40, y);
  doc.text('Nama Siswa', 105, y);
  doc.text(`: ${report.nama || '-'}`, 135, y);
  y += 5;

  doc.text('Kelas', 14, y);
  doc.text(`: ${report.kelas || '-'}`, 40, y);
  doc.text('Tanggal Cetak', 105, y);
  doc.text(`: ${formatTanggalPDF(report.dibuatTanggal)} ${report.dibuatJam || ''}`, 135, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN KEHADIRAN', 14, y);
  y += 3;

  const s = report.summary;
  autoTable(doc, {
    startY: y,
    head: [['HADIR', 'TERLAMBAT', 'BOLOS', 'ALFA', 'SAKIT', 'IZIN', 'PULANG TANPA DATANG', 'IZIN PULANG', 'TOTAL']],
    body: [
      [
        s.hadir || 0,
        s.terlambat || 0,
        s.bolos || 0,
        s.alfa || 0,
        s.sakit || 0,
        s.izin || 0,
        s.pulangTanpaDatang || 0,
        s.izinPulang || 0,
        s.total || 0,
      ],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [40, 50, 70], fontStyle: 'bold', halign: 'center' },
    margin: { left: 14, right: 14 },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (lastTable ? lastTable.finalY : y) + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RINCIAN ABSENSI HARIAN', 14, y);
  y += 3;

  const body = (report.rows || []).map((row, i) => [
    i + 1,
    formatTanggalPDF(row.tanggal),
    row.jamDatang || '-',
    row.jamPulang || '-',
    String(row.status || '-').toUpperCase(),
    row.keterangan || '-',
    row.catatan || '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['No', 'Tanggal', 'Jam Datang', 'Jam Pulang', 'Status', 'Keterangan', 'Catatan']],
    body,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold', halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 44, halign: 'center' },
      5: { cellWidth: 36 },
      6: { cellWidth: 'auto' },
    },
    margin: { left: 10, right: 10, bottom: 16 },
    didDrawPage: () => {
      const p = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        `Rincian Riwayat Absensi Siswa - ${report.nama || 'Siswa'} (${report.nisn || '-'})`,
        10,
        pageHeight - 8
      );
      doc.text(`Halaman ${p}`, pageWidth - 10, pageHeight - 8, { align: 'right' });
    },
  });

  doc.save(report.filename || `Riwayat_Absensi_${report.nisn}.pdf`);
}

// 1. Master Siswa PDF
export function downloadMasterSiswaPDF(students: Siswa[], filterKelas?: string) {
  if (!students || students.length === 0) {
    alert('Tidak ada data siswa untuk dicetak.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const settings = loadSettings();

  const title = 'DAFTAR MASTER DATA SISWA';
  const subtitle = filterKelas
    ? `Kelas: ${filterKelas} • Total: ${students.length} Siswa`
    : `Semua Kelas • Total: ${students.length} Siswa`;

  drawSchoolHeader(doc, title, subtitle);

  const tableData = students.map((s, index) => [
    index + 1,
    s.nis,
    s.nama,
    s.kelas,
    s.waOrangtua ? `+${s.waOrangtua}` : '-',
    s.waAktif === 'YA' ? 'Aktif' : 'Nonaktif',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['No', 'NISN / Barcode', 'Nama Lengkap Siswa', 'Kelas', 'WhatsApp Ortu', 'Notif WA']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 30 },
      2: { cellWidth: 65 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 35 },
      5: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: () => {
      const p = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Dicetak melalui Panel Admin - ${settings.namaSekolah}`, 14, pageHeight - 8);
      doc.text(`Halaman ${p}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY : 120;
  drawSignatureBlock(doc, finalY);

  const kelasClean = (filterKelas || 'Semua').replace(/\s+/g, '_');
  doc.save(`Master_Siswa_${kelasClean}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 2. Laporan Absensi Harian (Log Scan)
export function downloadLaporanHarianAdminPDF(
  records: AbsenRecord[],
  date: string,
  filterKelas?: string,
  filterStatus?: string
) {
  if (!records || records.length === 0) {
    alert('Tidak ada log absensi yang sesuai untuk dicetak.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const settings = loadSettings();

  const title = 'LAPORAN REKAP ABSENSI REAL-TIME HARIAN';
  const subtitle = `Tanggal: ${formatTanggalPDF(date)} • Kelas: ${filterKelas || 'Semua'} • Status: ${filterStatus || 'Semua'} • Total: ${records.length} Catatan`;

  drawSchoolHeader(doc, title, subtitle);

  const tableData = records.map((r, index) => [
    index + 1,
    r.nis,
    r.namaSiswa,
    r.kelas,
    r.jamDatang || '-',
    r.jamPulang || '-',
    r.status || '-',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['No', 'NISN', 'Nama Siswa', 'Kelas', 'Jam Datang', 'Jam Pulang', 'Status Kehadiran']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 32 },
      2: { cellWidth: 70 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 30 },
      5: { halign: 'center', cellWidth: 30 },
      6: { halign: 'center', cellWidth: 50 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: () => {
      const p = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Panel Admin Absensi QR Code - ${settings.namaSekolah}`, 14, pageHeight - 8);
      doc.text(`Halaman ${p}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY : 120;
  drawSignatureBlock(doc, finalY);

  doc.save(`Laporan_Absensi_${date}_${(filterKelas || 'Semua').replace(/\s+/g, '_')}.pdf`);
}

// 3. Laporan Keterangan Sakit & Izin
export function downloadLaporanKeteranganPDF(records: KeteranganRecord[], filterJenis?: string) {
  if (!records || records.length === 0) {
    alert('Tidak ada data surat izin/sakit untuk dicetak.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const settings = loadSettings();

  const title = 'LAPORAN REKAPITULASI SURAT SAKIT & IZIN SISWA';
  const subtitle = `Filter: ${filterJenis || 'Semua (Sakit & Izin)'} • Total: ${records.length} Catatan`;

  drawSchoolHeader(doc, title, subtitle);

  const tableData = records.map((k, index) => [
    index + 1,
    formatTanggalPDF(k.tanggal),
    k.nis,
    k.namaSiswa,
    k.kelas,
    k.keterangan,
    k.catatan || '-',
    k.admin || 'Petugas Piket',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['No', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis', 'Keterangan / Alasan', 'Petugas']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 24 },
      3: { cellWidth: 44 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { cellWidth: 32 },
      7: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: () => {
      const p = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Panel Admin Absensi QR Code - ${settings.namaSekolah}`, 14, pageHeight - 8);
      doc.text(`Halaman ${p}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY : 120;
  drawSignatureBlock(doc, finalY);

  doc.save(`Laporan_Sakit_Izin_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 4. Laporan Log WhatsApp Notifikasi Orang Tua
export function downloadLogWAPDF(logs: LogWARecord[]) {
  if (!logs || logs.length === 0) {
    alert('Tidak ada data log WhatsApp untuk dicetak.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const settings = loadSettings();

  const title = 'LAPORAN LOG AUDIT NOTIFIKASI WHATSAPP ORANG TUA';
  const subtitle = `Total Notifikasi: ${logs.length} Pesan • Waktu Cetak: ${new Date().toLocaleDateString('id-ID')}`;

  drawSchoolHeader(doc, title, subtitle);

  const tableData = logs.map((l, index) => [
    index + 1,
    l.timestamp.replace('T', ' '),
    l.nis,
    l.namaSiswa,
    l.kelas,
    l.nomorWA ? `+${l.nomorWA}` : '-',
    l.event,
    l.statusProses,
    l.waktuProses || '-',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['No', 'Waktu Dibuat', 'NISN', 'Nama Siswa', 'Kelas', 'No. WhatsApp', 'Kejadian', 'Status', 'Waktu Proses']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 32 },
      2: { halign: 'center', cellWidth: 26 },
      3: { cellWidth: 55 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 34 },
      6: { halign: 'center', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 32 },
      8: { halign: 'center', cellWidth: 30 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: () => {
      const p = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Panel Admin Absensi QR Code - ${settings.namaSekolah}`, 14, pageHeight - 8);
      doc.text(`Halaman ${p}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY : 120;
  drawSignatureBlock(doc, finalY);

  doc.save(`Laporan_Log_WA_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 5. Rekapitulasi Lengkap Seluruh Siswa
export function downloadRekapitulasiSemuaSiswaPDF(rekapList: RekapSiswaItem[], filterKelas?: string) {
  if (!rekapList || rekapList.length === 0) {
    alert('Tidak ada data rekapitulasi untuk dicetak.');
    return;
  }

  const filtered = filterKelas
    ? rekapList.filter((r) => r.kelas === filterKelas)
    : rekapList;

  if (filtered.length === 0) {
    alert(`Tidak ada siswa pada kelas ${filterKelas}.`);
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const settings = loadSettings();

  const title = 'LAPORAN REKAPITULASI KEHADIRAN & PELANGGARAN SISWA';
  const subtitle = `Periode Akumulasi Mulai: ${formatTanggalPDF(settings.rekapMulaiDate)} • Kelas: ${filterKelas || 'Semua Kelas'} • Total: ${filtered.length} Siswa`;

  drawSchoolHeader(doc, title, subtitle);

  const tableData = filtered.map((r, index) => [
    index + 1,
    r.nisn,
    r.nama,
    r.kelas,
    r.terlambat || 0,
    r.bolos || 0,
    r.alfa || 0,
    r.sakit || 0,
    r.izin || 0,
    r.izinPulang || 0,
    r.pulangTanpaDatang || 0,
    r.totalPelanggaran || 0,
  ]);

  autoTable(doc, {
    startY: 38,
    head: [
      [
        'No',
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Terlambat',
        'Bolos',
        'Alfa',
        'Sakit',
        'Izin',
        'Izin Pulang',
        'Pulang Cepat',
        'Total',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 55 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'center', cellWidth: 22 },
      10: { halign: 'center', cellWidth: 22 },
      11: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: () => {
      const p = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Panel Admin Absensi QR Code - ${settings.namaSekolah}`, 14, pageHeight - 8);
      doc.text(`Halaman ${p}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY : 120;
  drawSignatureBlock(doc, finalY);

  const kelasClean = (filterKelas || 'Semua_Kelas').replace(/\s+/g, '_');
  doc.save(`Rekapitulasi_Kehadiran_${kelasClean}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
