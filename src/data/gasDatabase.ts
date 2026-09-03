import {
  GasDatabaseConfig,
  GasSyncLog,
  Siswa,
  AbsenRecord,
  KeteranganRecord,
  LogWARecord,
  AppSettings,
} from '../types';
import {
  loadStudents,
  saveStudents,
  loadAbsenRecords,
  saveAbsenRecords,
  loadKeteranganRecords,
  saveKeteranganRecords,
  loadLogWARecords,
  loadSettings,
  getTodayString,
} from './database';

const GAS_CONFIG_KEY = 'SMAN5_GAS_CONFIG_V3';

export const DEFAULT_GAS_CONFIG: GasDatabaseConfig = {
  webAppUrl: '',
  spreadsheetUrl: '',
  autoSyncOnScan: false,
  autoSyncOnKeterangan: false,
  lastSyncStatus: 'IDLE',
  syncHistory: [],
};

export function loadGasConfig(): GasDatabaseConfig {
  try {
    const raw = localStorage.getItem(GAS_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_GAS_CONFIG,
        ...parsed,
        syncHistory: Array.isArray(parsed.syncHistory) ? parsed.syncHistory : [],
      };
    }
  } catch (e) {
    console.error('Error loading GAS config:', e);
  }
  return DEFAULT_GAS_CONFIG;
}

export function saveGasConfig(config: GasDatabaseConfig): void {
  try {
    // Keep at most 25 recent sync logs in storage
    const trimmedLogs = (config.syncHistory || []).slice(0, 25);
    const toSave = { ...config, syncHistory: trimmedLogs };
    localStorage.setItem(GAS_CONFIG_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving GAS config:', e);
  }
}

export function addGasSyncLog(
  entry: Omit<GasSyncLog, 'id' | 'timestamp'>
): GasDatabaseConfig {
  const current = loadGasConfig();
  const newLog: GasSyncLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }),
    ...entry,
  };

  const updated: GasDatabaseConfig = {
    ...current,
    lastSyncTime: newLog.timestamp,
    lastSyncStatus: entry.status,
    lastSyncMessage: entry.message,
    syncHistory: [newLog, ...(current.syncHistory || [])].slice(0, 25),
  };

  saveGasConfig(updated);
  return updated;
}

/**
 * Uji koneksi ke endpoint Google Apps Script Web App via GET action=ping
 */
export async function testGasConnection(url: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl) {
    return { success: false, message: 'URL Web App Google Apps Script masih kosong.' };
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'Format URL salah. URL harus diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  const pingUrl = cleanUrl.includes('?')
    ? `${cleanUrl}&action=ping&_t=${Date.now()}`
    : `${cleanUrl}?action=ping&_t=${Date.now()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server GAS merespons dengan HTTP status ${res.status}`);
    }

    const data = await res.json();
    if (data.status === 'success' || data.success === true || data.status === 'OK') {
      addGasSyncLog({
        action: 'PING_TEST',
        status: 'SUCCESS',
        message: data.message || 'Koneksi ke Google Apps Script berhasil.',
      });
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Spreadsheet melalui GAS aktif & merespons dengan baik!',
        data,
      };
    }

    return {
      success: true,
      message: 'Koneksi merespons balik dari Google Apps Script.',
      data,
    };
  } catch (err: any) {
    const msg = err.name === 'AbortError'
      ? 'Koneksi timeout (lebih dari 12 detik). Pastikan script sudah di-deploy dengan akses "Anyone".'
      : `Gagal terhubung ke GAS: ${err.message || 'Periksa URL dan izin akses script (Who has access: Anyone).'}`;

    addGasSyncLog({
      action: 'PING_TEST',
      status: 'ERROR',
      message: msg,
    });

    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Kirim SEMUA data aplikasi (Siswa, Absen, Keterangan, Log WA, Settings) ke Google Sheets
 */
export async function pushAllDataToGas(customUrl?: string): Promise<{
  success: boolean;
  message: string;
  totalRecords?: number;
}> {
  const config = loadGasConfig();
  const targetUrl = (customUrl || config.webAppUrl || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi. Masukkan URL pada tab Pengaturan GAS.',
    };
  }

  const students = loadStudents();
  const absenRecords = loadAbsenRecords();
  const keteranganRecords = loadKeteranganRecords();
  const logWARecords = loadLogWARecords();
  const settings = loadSettings();

  const payload = {
    action: 'syncAll',
    secretToken: 'SMAN5_BOMBANA_SECURE',
    timestamp: new Date().toISOString(),
    data: {
      students,
      absenRecords,
      keteranganRecords,
      logWARecords,
      settings,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    // Menggunakan text/plain agar browser tidak memblokir CORS preflight ke Google Apps Script
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const total =
      students.length +
      absenRecords.length +
      keteranganRecords.length +
      logWARecords.length;

    let responseData: any = null;
    try {
      responseData = await res.json();
    } catch {
      // GAS might return HTML or plain text on redirect
    }

    const successMsg =
      responseData?.message ||
      `Berhasil mengekspor ${students.length} siswa, ${absenRecords.length} log absensi, & ${keteranganRecords.length} keterangan ke Google Sheets.`;

    addGasSyncLog({
      action: 'PUSH_ALL',
      status: 'SUCCESS',
      message: successMsg,
      itemCount: total,
    });

    return {
      success: true,
      message: successMsg,
      totalRecords: total,
    };
  } catch (err: any) {
    const errorMsg =
      err.name === 'AbortError'
        ? 'Sinkronisasi timeout. Coba sinkronkan per hari atau periksa koneksi internet.'
        : `Gagal mengirim data ke Google Sheets: ${err.message || 'Periksa URL Web App GAS'}`;

    addGasSyncLog({
      action: 'PUSH_ALL',
      status: 'ERROR',
      message: errorMsg,
    });

    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Kirim data absensi hari aktif saja ke Google Sheets
 */
export async function pushTodayAbsenToGas(targetDate?: string): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const config = loadGasConfig();
  const targetUrl = (config.webAppUrl || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.',
    };
  }

  const tgl = targetDate || getTodayString();
  const allAbsen = loadAbsenRecords();
  const todayAbsen = allAbsen.filter((a) => a.tanggal === tgl);
  const allKet = loadKeteranganRecords();
  const todayKet = allKet.filter((k) => k.tanggal === tgl);

  const payload = {
    action: 'syncDate',
    tanggal: tgl,
    timestamp: new Date().toISOString(),
    data: {
      absenRecords: todayAbsen,
      keteranganRecords: todayKet,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const count = todayAbsen.length + todayKet.length;
    const msg = `Berhasil menyinkronkan ${todayAbsen.length} log absensi & ${todayKet.length} keterangan tanggal ${tgl} ke Spreadsheet.`;

    addGasSyncLog({
      action: 'PUSH_TODAY',
      status: 'SUCCESS',
      message: msg,
      itemCount: count,
    });

    return {
      success: true,
      message: msg,
      count,
    };
  } catch (err: any) {
    const errorMsg = `Gagal sinkronisasi data tanggal ${tgl}: ${err.message || 'Periksa koneksi'}`;
    addGasSyncLog({
      action: 'PUSH_TODAY',
      status: 'ERROR',
      message: errorMsg,
    });
    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Tarik data siswa dari Google Sheets (Pull Data)
 */
export async function pullStudentsFromGas(): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const config = loadGasConfig();
  const targetUrl = (config.webAppUrl || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.',
    };
  }

  const pullUrl = targetUrl.includes('?')
    ? `${targetUrl}&action=getStudents&_t=${Date.now()}`
    : `${targetUrl}?action=getStudents&_t=${Date.now()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(pullUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error status ${res.status}`);
    }

    const json = await res.json();
    if (!json || !Array.isArray(json.data) || json.data.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data siswa yang ditemukan pada Sheet Data_Siswa.',
      };
    }

    // Sanitize and save students
    const importedStudents: Siswa[] = json.data
      .filter((row: any) => row.nis || row.nisn)
      .map((row: any) => ({
        nis: String(row.nis || row.nisn || '').padStart(10, '0'),
        nama: String(row.nama || row.namaSiswa || 'Siswa').trim(),
        kelas: String(row.kelas || '-').trim(),
        waOrangtua: String(row.waOrangtua || row.noHp || '').replace(/[^0-9]/g, ''),
        waAktif: row.waAktif || 'YA',
      }));

    if (importedStudents.length === 0) {
      return {
        success: false,
        message: 'Baris pada spreadsheet tidak memiliki kolom NIS / NISN yang valid.',
      };
    }

    saveStudents(importedStudents);

    const msg = `Berhasil mengimpor ${importedStudents.length} siswa dari Google Sheets ke penyimpanan lokal.`;
    addGasSyncLog({
      action: 'PULL_DATA',
      status: 'SUCCESS',
      message: msg,
      itemCount: importedStudents.length,
    });

    return {
      success: true,
      message: msg,
      count: importedStudents.length,
    };
  } catch (err: any) {
    const errorMsg = `Gagal menarik data dari Google Sheets: ${err.message || 'Periksa URL GAS'}`;
    addGasSyncLog({
      action: 'PULL_DATA',
      status: 'ERROR',
      message: errorMsg,
    });
    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Background auto-sync function saat ada absensi baru (non-blocking)
 */
export function autoSyncAbsenRecordToGas(record: AbsenRecord): void {
  try {
    const config = loadGasConfig();
    if (!config.webAppUrl || !config.autoSyncOnScan) return;

    // Send silently without blocking scanner UI
    const payload = {
      action: 'appendAbsen',
      timestamp: new Date().toISOString(),
      record,
    };

    fetch(config.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors', // Best for fire-and-forget GAS webhook
    }).catch(() => {
      // silent catch for background non-blocking
    });
  } catch (e) {
    console.warn('Auto sync GAS error:', e);
  }
}

/**
 * Background auto-sync function saat ada keterangan sakit/izin baru
 */
export function autoSyncKeteranganToGas(record: KeteranganRecord): void {
  try {
    const config = loadGasConfig();
    if (!config.webAppUrl || !config.autoSyncOnKeterangan) return;

    const payload = {
      action: 'appendKeterangan',
      timestamp: new Date().toISOString(),
      record,
    };

    fetch(config.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    }).catch(() => {
      // silent
    });
  } catch (e) {
    console.warn('Auto sync keterangan GAS error:', e);
  }
}

/**
 * Template Kode Google Apps Script (Code.gs) Resmi Siap Salin
 */
export const OFFICIAL_GAS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (GAS) - DATABASE ENGINE ABSENSI SMAN 05 BOMBANA
 * =========================================================================
 * Script ini berfungsi sebagai API RESTful gratis untuk menghubungkan
 * aplikasi absensi QR Code SMAN 05 Bombana langsung ke Google Sheets.
 * 
 * LANGKAH DEPLOYMENT:
 * 1. Buat Spreadsheet Google baru (misal: "DATABASE ABSENSI SMAN 05 BOMBANA")
 * 2. Buka menu Ekstensi > Apps Script
 * 3. Hapus semua kode default dan tempelkan seluruh kode script ini.
 * 4. Klik tombol "Deploy" (Terapkan) > "New deployment" (Deployment baru).
 * 5. Pilih jenis: "Web app" (Aplikasi Web).
 * 6. Deskripsi: "API Database Absensi SMAN 5 Bombana v1"
 * 7. Execute as: "Me" (Email Google Anda)
 * 8. Who has access: "Anyone" (Siapa saja)  <-- WAJIB PILIH "ANYONE"
 * 9. Klik "Deploy" & salin URL Web App yang berakhiran /exec
 * 10. Tempelkan URL tersebut ke Panel Administrator aplikasi Absensi.
 * =========================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Endpoint: Ping / Uji Koneksi
  if (action === 'ping') {
    return jsonResponse({
      status: 'success',
      message: 'Koneksi ke Google Spreadsheet SMAN 05 Bombana AKTIF & Normal!',
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    });
  }

  // Endpoint: Ambil Master Data Siswa
  if (action === 'getStudents') {
    var sheet = ss.getSheetByName('Data_Siswa');
    if (!sheet) {
      return jsonResponse({ status: 'error', message: 'Sheet Data_Siswa belum dibuat.', data: [] });
    }
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonResponse({ status: 'success', data: [] });
    }

    var students = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[1]) {
        students.push({
          nis: String(r[0] || '').trim(),
          nama: String(r[1] || '').trim(),
          kelas: String(r[2] || '').trim(),
          waOrangtua: String(r[3] || '').trim(),
          waAktif: String(r[4] || 'YA').trim()
        });
      }
    }
    return jsonResponse({ status: 'success', total: students.length, data: students });
  }

  // Endpoint: Ambil Seluruh Data
  if (action === 'getAll') {
    return jsonResponse({
      status: 'success',
      spreadsheetName: ss.getName(),
      sheets: ss.getSheets().map(function(s) { return s.getName(); })
    });
  }

  return jsonResponse({ status: 'error', message: 'Action tidak dikenali.' });
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var action = payload.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. SINKRONISASI PENUH SEMUA DATA (PUSH ALL)
    if (action === 'syncAll') {
      var data = payload.data || {};
      
      // Sinkronkan Sheet Data_Siswa
      if (data.students && Array.isArray(data.students)) {
        syncSheetStudents(ss, data.students);
      }

      // Sinkronkan Sheet Log_Absensi
      if (data.absenRecords && Array.isArray(data.absenRecords)) {
        syncSheetAbsensi(ss, data.absenRecords);
      }

      // Sinkronkan Sheet Keterangan_Sakit_Izin
      if (data.keteranganRecords && Array.isArray(data.keteranganRecords)) {
        syncSheetKeterangan(ss, data.keteranganRecords);
      }

      // Sinkronkan Sheet Log_WhatsApp
      if (data.logWARecords && Array.isArray(data.logWARecords)) {
        syncSheetLogWA(ss, data.logWARecords);
      }

      // Simpan Info Pengaturan
      if (data.settings) {
        syncSheetSettings(ss, data.settings);
      }

      return jsonResponse({
        status: 'success',
        message: 'Semua data aplikasi berhasil disinkronkan ke Spreadsheet SMAN 05 Bombana.',
        timestamp: new Date().toISOString()
      });
    }

    // 2. TAMBAH/UPDATE SATU RECORD ABSENSI (REALTIME AUTO-SYNC)
    if (action === 'appendAbsen') {
      var rec = payload.record;
      if (rec) {
        appendOrUpdateAbsenRecord(ss, rec);
        return jsonResponse({ status: 'success', message: 'Absensi siswa berhasil dicatat ke Spreadsheet.' });
      }
    }

    // 3. TAMBAH SATU RECORD KETERANGAN SAKIT/IZIN
    if (action === 'appendKeterangan') {
      var kRec = payload.record;
      if (kRec) {
        appendKeteranganRecord(ss, kRec);
        return jsonResponse({ status: 'success', message: 'Keterangan berhasil dicatat ke Spreadsheet.' });
      }
    }

    // 4. SINKRONISASI ABSENSI TANGGAL TERTENTU
    if (action === 'syncDate') {
      var dateData = payload.data || {};
      if (dateData.absenRecords) {
        syncDateAbsensi(ss, payload.tanggal, dateData.absenRecords);
      }
      return jsonResponse({ status: 'success', message: 'Data tanggal ' + payload.tanggal + ' berhasil disinkronkan.' });
    }

    return jsonResponse({ status: 'error', message: 'Action POST tidak dikenal.' });
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Gagal memproses data: ' + err.toString()
    });
  }
}

// -------------------------------------------------------------
// HELPER INTERNAL SPREADSHEET BUILDER & STYLING
// -------------------------------------------------------------

function getOrCreateSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor || '#1e293b');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function syncSheetStudents(ss, students) {
  var sheet = getOrCreateSheet(ss, 'Data_Siswa', ['NIS / NISN', 'Nama Lengkap Siswa', 'Kelas', 'No. WhatsApp Ortu', 'Status Notif WA'], '#1e1b4b');
  sheet.clearContents();
  sheet.appendRow(['NIS / NISN', 'Nama Lengkap Siswa', 'Kelas', 'No. WhatsApp Ortu', 'Status Notif WA']);
  var headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange.setBackground('#1e1b4b');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (students.length === 0) return;
  var rows = students.map(function(s) {
    return ["'" + String(s.nis || '').padStart(10, '0'), s.nama, s.kelas, "'" + String(s.waOrangtua || ''), s.waAktif || 'YA'];
  });
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  sheet.autoResizeColumns(1, 5);
}

function syncSheetAbsensi(ss, records) {
  var sheet = getOrCreateSheet(ss, 'Log_Absensi', ['ID Transaksi', 'Tanggal', 'Jam Datang', 'Jam Pulang', 'NISN', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Waktu Sinkron'], '#0f172a');
  sheet.clearContents();
  sheet.appendRow(['ID Transaksi', 'Tanggal', 'Jam Datang', 'Jam Pulang', 'NISN', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Waktu Sinkron']);
  var headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setBackground('#0f172a');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (records.length === 0) return;
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var rows = records.map(function(r) {
    return [r.id || '', r.tanggal || '', r.jamDatang || '-', r.jamPulang || '-', "'" + String(r.nis || '').padStart(10, '0'), r.namaSiswa || '', r.kelas || '', r.status || '', nowStr];
  });
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.autoResizeColumns(1, 9);
}

function syncSheetKeterangan(ss, records) {
  var sheet = getOrCreateSheet(ss, 'Keterangan_Sakit_Izin', ['ID', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Keterangan', 'Catatan / Alasan', 'Dicatat Oleh', 'Waktu Input'], '#042f2e');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Keterangan', 'Catatan / Alasan', 'Dicatat Oleh', 'Waktu Input']);
  var headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setBackground('#042f2e');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (records.length === 0) return;
  var rows = records.map(function(k) {
    return [k.id || '', k.tanggal || '', "'" + String(k.nis || '').padStart(10, '0'), k.namaSiswa || '', k.kelas || '', k.keterangan || '', k.catatan || '-', k.admin || 'Piket', k.timestamp || ''];
  });
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.autoResizeColumns(1, 9);
}

function syncSheetLogWA(ss, records) {
  var sheet = getOrCreateSheet(ss, 'Log_WhatsApp', ['ID', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Event', 'Nomor WA', 'Status Proses', 'Waktu Kirim'], '#064e3b');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Event', 'Nomor WA', 'Status Proses', 'Waktu Kirim']);
  var headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setBackground('#064e3b');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (records.length === 0) return;
  var rows = records.map(function(l) {
    return [l.id || '', l.tanggal || '', "'" + String(l.nis || '').padStart(10, '0'), l.namaSiswa || '', l.kelas || '', l.event || '', "'" + String(l.nomorWA || ''), l.statusProses || '', l.waktuProses || '-'];
  });
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.autoResizeColumns(1, 9);
}

function syncSheetSettings(ss, settings) {
  var sheet = getOrCreateSheet(ss, 'Pengaturan_Sekolah', ['Parameter', 'Nilai', 'Keterangan'], '#312e81');
  sheet.clearContents();
  sheet.appendRow(['Parameter', 'Nilai', 'Keterangan']);
  var rows = [
    ['Nama Sekolah', settings.namaSekolah || 'SMAN 05 Bombana', 'Identitas Sekolah'],
    ['Alamat', settings.alamatSekolah || '', 'Lokasi Sekolah'],
    ['Kepala Sekolah', settings.kepalaSekolah || '', 'Nama & Gelar'],
    ['NIP Kepala Sekolah', "'" + String(settings.nipKepalaSekolah || ''), 'NIP Pegawai'],
    ['Batas Jam Datang', settings.batasDatang || '07:00:00', 'Jam Tepat Waktu'],
    ['Batas Jam Alfa', settings.batasAlfa || '08:00:00', 'Batas Toleransi Keterlambatan'],
    ['Batas Jam Pulang', settings.batasPulang || '14:20:00', 'Jam Pulang Standar'],
    ['Tanggal Mulai Rekap', settings.rekapMulaiDate || '', 'Awal Periode Semester']
  ];
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  sheet.autoResizeColumns(1, 3);
}

function appendOrUpdateAbsenRecord(ss, rec) {
  var sheet = getOrCreateSheet(ss, 'Log_Absensi', ['ID Transaksi', 'Tanggal', 'Jam Datang', 'Jam Pulang', 'NISN', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Waktu Sinkron'], '#0f172a');
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  
  // Cek apakah tanggal dan NISN sudah ada
  var data = sheet.getDataRange().getValues();
  var nisClean = String(rec.nis || '').padStart(10, '0');
  var foundRow = -1;

  for (var i = 1; i < data.length; i++) {
    var tglRow = String(data[i][1]);
    var nisRow = String(data[i][4]).replace(/^'/, '');
    if (tglRow === rec.tanggal && nisRow === nisClean) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow !== -1) {
    // Update existing row
    if (rec.jamDatang && rec.jamDatang !== '-') sheet.getRange(foundRow, 3).setValue(rec.jamDatang);
    if (rec.jamPulang && rec.jamPulang !== '-') sheet.getRange(foundRow, 4).setValue(rec.jamPulang);
    if (rec.status) sheet.getRange(foundRow, 8).setValue(rec.status);
    sheet.getRange(foundRow, 9).setValue(nowStr);
  } else {
    // Append new row
    sheet.appendRow([
      rec.id || ('scan-' + rec.tanggal + '-' + nisClean),
      rec.tanggal,
      rec.jamDatang || '-',
      rec.jamPulang || '-',
      "'" + nisClean,
      rec.namaSiswa || '',
      rec.kelas || '',
      rec.status || '',
      nowStr
    ]);
  }
}

function appendKeteranganRecord(ss, kRec) {
  var sheet = getOrCreateSheet(ss, 'Keterangan_Sakit_Izin', ['ID', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Keterangan', 'Catatan / Alasan', 'Dicatat Oleh', 'Waktu Input'], '#042f2e');
  var nisClean = String(kRec.nis || '').padStart(10, '0');
  sheet.appendRow([
    kRec.id || ('ket-' + kRec.tanggal + '-' + nisClean),
    kRec.tanggal,
    "'" + nisClean,
    kRec.namaSiswa || '',
    kRec.kelas || '',
    kRec.keterangan || '',
    kRec.catatan || '-',
    kRec.admin || 'Piket',
    kRec.timestamp || new Date().toISOString()
  ]);
}

function syncDateAbsensi(ss, tanggal, records) {
  var sheet = getOrCreateSheet(ss, 'Log_Absensi', ['ID Transaksi', 'Tanggal', 'Jam Datang', 'Jam Pulang', 'NISN', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Waktu Sinkron'], '#0f172a');
  records.forEach(function(rec) {
    appendOrUpdateAbsenRecord(ss, rec);
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
