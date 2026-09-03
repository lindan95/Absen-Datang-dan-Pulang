import {
  Siswa,
  AbsenRecord,
  KeteranganRecord,
  LogWARecord,
  DashboardData,
  StudentAbsenStatus,
  RekapKelasData,
  RekapSiswaItem,
  WABatchResult,
  WABatchItem,
  RiwayatSiswaReport,
  AppSettings,
} from '../types';

export const PANJANG_NIS = 10;
export const BATAS_DATANG = '07:00:00';
export const BATAS_ALFA = '08:00:00';
export const BATAS_PULANG = '14:20:00';
export const REKAP_MULAI_DATE = '2026-08-25';

export const DEFAULT_SETTINGS: AppSettings = {
  batasDatang: '07:00:00',
  batasAlfa: '08:00:00',
  batasPulang: '14:20:00',
  rekapMulaiDate: '2026-08-25',
  namaSekolah: 'SMA NEGERI 05 BOMBANA',
  alamatSekolah: 'Jl. Pendidikan No. 05, Kabaena Timur, Kab. Bombana, Sulawesi Tenggara',
  kepalaSekolah: 'Drs. H. Sudirman, M.Pd.',
  nipKepalaSekolah: '19720514 199802 1 003',
  defaultAdmin: 'Petugas Piket / BK',
  adminPin: '123456',
};

const STORAGE_KEYS = {
  SISWA: 'SMAN5_DATA_SISWA_V3',
  ABSEN: 'SMAN5_SHEET5_SCAN_V3',
  KETERANGAN: 'SMAN5_KETERANGAN_ABSENSI_V3',
  LOG_WA: 'SMAN5_LOG_WA_V3',
  SETTINGS: 'SMAN5_SETTINGS_V3',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function normalizeNIS(value: string | number | null | undefined): string {
  let nis = String(value ?? '').trim().replace(/\s+/g, '');
  if (!nis) return '';
  if (/^\d+$/.test(nis)) {
    return nis.padStart(PANJANG_NIS, '0');
  }
  return nis;
}

// Initial realistic students for SMA NEGERI 05 BOMBANA
export const initialStudents: Siswa[] = [
  // Kelas X-1
  { nis: '0081234001', nama: 'Ahmad Fauzan Pratama', kelas: 'X-1', waOrangtua: '6281234567801', waAktif: 'YA' },
  { nis: '0081234002', nama: 'Aisyah Nur Rahmawati', kelas: 'X-1', waOrangtua: '6281234567802', waAktif: 'YA' },
  { nis: '0081234003', nama: 'Budi Santoso Sudirman', kelas: 'X-1', waOrangtua: '6281234567803', waAktif: 'YA' },
  { nis: '0081234004', nama: 'Dewi Sartika Bombana', kelas: 'X-1', waOrangtua: '6281234567804', waAktif: 'YA' },
  { nis: '0081234005', nama: 'Fajar Hidayatullah', kelas: 'X-1', waOrangtua: '6281234567805', waAktif: 'YA' },
  { nis: '0081234006', nama: 'Gita Maharani Putri', kelas: 'X-1', waOrangtua: '6281234567806', waAktif: 'YA' },
  
  // Kelas X-2
  { nis: '0081234007', nama: 'Hendri Setiawan Jaya', kelas: 'X-2', waOrangtua: '6281234567807', waAktif: 'YA' },
  { nis: '0081234008', nama: 'Intan Permatasari', kelas: 'X-2', waOrangtua: '6281234567808', waAktif: 'YA' },
  { nis: '0081234009', nama: 'Joko Prabowo Kabaena', kelas: 'X-2', waOrangtua: '6281234567809', waAktif: 'YA' },
  { nis: '0081234010', nama: 'Kartika Sari Dewi', kelas: 'X-2', waOrangtua: '6281234567810', waAktif: 'YA' },
  { nis: '0081234011', nama: 'Lukman Hakim Al-Farizi', kelas: 'X-2', waOrangtua: '6281234567811', waAktif: 'YA' },
  
  // Kelas XI-MIPA 1
  { nis: '0071234012', nama: 'Muhammad Rizky Ramadhan', kelas: 'XI-MIPA 1', waOrangtua: '6281234567812', waAktif: 'YA' },
  { nis: '0071234013', nama: 'Nabila Azzahra Fitriani', kelas: 'XI-MIPA 1', waOrangtua: '6281234567813', waAktif: 'YA' },
  { nis: '0071234014', nama: 'Oki Pratama Yudha', kelas: 'XI-MIPA 1', waOrangtua: '6281234567814', waAktif: 'YA' },
  { nis: '0071234015', nama: 'Putri Ayu Wandira', kelas: 'XI-MIPA 1', waOrangtua: '6281234567815', waAktif: 'YA' },
  { nis: '0071234016', nama: 'Rahmat Hidayatullah Syah', kelas: 'XI-MIPA 1', waOrangtua: '6281234567816', waAktif: 'YA' },
  { nis: '0071234017', nama: 'Siti Nurhaliza Hasan', kelas: 'XI-MIPA 1', waOrangtua: '6281234567817', waAktif: 'YA' },

  // Kelas XI-IPS 1
  { nis: '0071234018', nama: 'Teguh Wibowo Saputra', kelas: 'XI-IPS 1', waOrangtua: '6281234567818', waAktif: 'YA' },
  { nis: '0071234019', nama: 'Umar Wirahadikusumah', kelas: 'XI-IPS 1', waOrangtua: '6281234567819', waAktif: 'YA' },
  { nis: '0071234020', nama: 'Vina Panduwinata Putri', kelas: 'XI-IPS 1', waOrangtua: '6281234567820', waAktif: 'YA' },
  { nis: '0071234021', nama: 'Wahyu Nugroho Aditama', kelas: 'XI-IPS 1', waOrangtua: '6281234567821', waAktif: 'YA' },

  // Kelas XII-MIPA
  { nis: '0061234022', nama: 'Yusuf Maulana Alamsyah', kelas: 'XII-MIPA', waOrangtua: '6281234567822', waAktif: 'YA' },
  { nis: '0061234023', nama: 'Zahra Amelia Lestari', kelas: 'XII-MIPA', waOrangtua: '6281234567823', waAktif: 'YA' },
  { nis: '0061234024', nama: 'Aldi Firmansyah Tanjung', kelas: 'XII-MIPA', waOrangtua: '6281234567824', waAktif: 'YA' },
  { nis: '0061234025', nama: 'Bella Safitri Rahayu', kelas: 'XII-MIPA', waOrangtua: '6281234567825', waAktif: 'YA' },
  { nis: '0061234026', nama: 'Chandra Wijaya Kusuma', kelas: 'XII-MIPA', waOrangtua: '6281234567826', waAktif: 'YA' },

  // Kelas XII-IPS
  { nis: '0061234027', nama: 'Dian Anggraini Maharani', kelas: 'XII-IPS', waOrangtua: '6281234567827', waAktif: 'YA' },
  { nis: '0061234028', nama: 'Eko Prasetyo Utomo', kelas: 'XII-IPS', waOrangtua: '6281234567828', waAktif: 'YA' },
  { nis: '0061234029', nama: 'Fitri Handayani Daeng', kelas: 'XII-IPS', waOrangtua: '6281234567829', waAktif: 'YA' },
  { nis: '0061234030', nama: 'Gilang Ramadhan Kasim', kelas: 'XII-IPS', waOrangtua: '6281234567830', waAktif: 'YA' },
  { nis: '0061234031', nama: 'Hanafi Rustam Bajo', kelas: 'XII-IPS', waOrangtua: '6281234567831', waAktif: 'YA' }
];

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

// Generate rich initial historical records from 2026-08-25 through today (2026-09-02)
function generateInitialHistoricalRecords(students: Siswa[]): {
  records: AbsenRecord[];
  keterangan: KeteranganRecord[];
} {
  const records: AbsenRecord[] = [];
  const keterangan: KeteranganRecord[] = [];

  const dates = [
    '2026-08-25',
    '2026-08-26',
    '2026-08-27',
    '2026-08-28',
    '2026-08-31',
    '2026-09-01',
    '2026-09-02', // Today
  ];

  dates.forEach((tgl, dayIdx) => {
    students.forEach((s, sIdx) => {
      const isToday = tgl === getTodayString();
      const seed = (sIdx * 17 + dayIdx * 29) % 100;

      // For today, create some present, some late, some bolos/alfa, some with sick note
      if (isToday) {
        if (seed < 55) {
          // Hadir Tepat
          const min = String(10 + (seed % 40)).padStart(2, '0');
          const sec = String(seed % 60).padStart(2, '0');
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T06:${min}:${sec}`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: `06:${min}:${sec}`,
            jamPulang: '-',
            status: 'HADIR',
          });
        } else if (seed < 70) {
          // Terlambat
          const min = String(5 + (seed % 35)).padStart(2, '0');
          const sec = String(seed % 60).padStart(2, '0');
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T07:${min}:${sec}`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: `07:${min}:${sec}`,
            jamPulang: '-',
            status: 'TERLAMBAT',
          });
        } else if (seed < 78) {
          // Sakit via Keterangan_Absensi
          keterangan.push({
            id: `ket-${tgl}-${s.nis}`,
            timestamp: `${tgl}T07:15:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            keterangan: 'SAKIT',
            catatan: 'Surat dokter terlampir / demam',
            admin: 'Piket BP/BK',
          });
        } else if (seed < 84) {
          // Izin via Keterangan_Absensi
          keterangan.push({
            id: `ket-${tgl}-${s.nis}`,
            timestamp: `${tgl}T07:20:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            keterangan: 'IZIN',
            catatan: 'Acara keluarga di Poleang',
            admin: 'Piket Guru',
          });
        } else if (seed < 88) {
          // Pulang cepat
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T06:50:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: '06:50:12',
            jamPulang: '10:45:00',
            status: 'IZIN PULANG (SAKIT - Demam di UKS)',
          });
        } else if (seed < 92) {
          // Pulang tanpa datang
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T14:30:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: '-',
            jamPulang: '14:30:15',
            status: 'PULANG TANPA DATANG',
          });
        }
        // Remaining are either Belum Absen or ALFA depending on time
      } else {
        // Historical days
        if (seed < 65) {
          // Hadir Tepat & Pulang
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T06:45:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: `06:${String(20 + (seed % 35)).padStart(2, '0')}:10`,
            jamPulang: `14:${String(25 + (seed % 30)).padStart(2, '0')}:22`,
            status: 'HADIR',
          });
        } else if (seed < 78) {
          // Terlambat & Pulang
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T07:15:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: `07:${String(5 + (seed % 30)).padStart(2, '0')}:15`,
            jamPulang: `14:35:10`,
            status: 'HADIR (TERLAMBAT)',
          });
        } else if (seed < 85) {
          // Bolos (Hadir pagi, tidak scan pulang)
          records.push({
            id: `rec-${tgl}-${s.nis}`,
            timestamp: `${tgl}T06:55:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            jamDatang: '06:55:12',
            jamPulang: '-',
            status: 'BOLOS',
          });
        } else if (seed < 90) {
          // Sakit
          keterangan.push({
            id: `ket-${tgl}-${s.nis}`,
            timestamp: `${tgl}T07:30:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            keterangan: 'SAKIT',
            catatan: 'Flu dan demam',
            admin: 'Piket',
          });
        } else if (seed < 94) {
          // Izin
          keterangan.push({
            id: `ket-${tgl}-${s.nis}`,
            timestamp: `${tgl}T07:30:00`,
            tanggal: tgl,
            nis: s.nis,
            namaSiswa: s.nama,
            kelas: s.kelas,
            keterangan: 'IZIN',
            catatan: 'Izin urusan keluarga',
            admin: 'Piket',
          });
        }
        // Others will count as ALFA automatically
      }
    });
  });

  return { records, keterangan };
}

// LocalStorage helpers
export function loadStudents(): Siswa[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SISWA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading students:', e);
  }
  saveStudents(initialStudents);
  return initialStudents;
}

export function saveStudents(students: Siswa[]) {
  localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(students));
}

export function loadAbsenRecords(): AbsenRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ABSEN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading absen records:', e);
  }
  const init = generateInitialHistoricalRecords(initialStudents);
  saveAbsenRecords(init.records);
  saveKeteranganRecords(init.keterangan);
  return init.records;
}

export function saveAbsenRecords(records: AbsenRecord[]) {
  localStorage.setItem(STORAGE_KEYS.ABSEN, JSON.stringify(records));
}

export function loadKeteranganRecords(): KeteranganRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KETERANGAN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading keterangan records:', e);
  }
  return [];
}

export function saveKeteranganRecords(records: KeteranganRecord[]) {
  localStorage.setItem(STORAGE_KEYS.KETERANGAN, JSON.stringify(records));
}

export function loadLogWARecords(): LogWARecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOG_WA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading log WA:', e);
  }
  return [];
}

export function saveLogWARecords(records: LogWARecord[]) {
  localStorage.setItem(STORAGE_KEYS.LOG_WA, JSON.stringify(records));
}

export function resetDatabaseToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.SISWA);
  localStorage.removeItem(STORAGE_KEYS.ABSEN);
  localStorage.removeItem(STORAGE_KEYS.KETERANGAN);
  localStorage.removeItem(STORAGE_KEYS.LOG_WA);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  saveStudents(initialStudents);
  saveSettings(DEFAULT_SETTINGS);
  const init = generateInitialHistoricalRecords(initialStudents);
  saveAbsenRecords(init.records);
  saveKeteranganRecords(init.keterangan);
  saveLogWARecords([]);
}

// ==========================================
// ADMIN CRUD & DATA MANAGEMENT FUNCTIONS
// ==========================================

// --- Siswa Management ---
export function addStudent(siswa: Siswa): { success: boolean; message: string } {
  const nisClean = normalizeNIS(siswa.nis);
  if (!nisClean) return { success: false, message: 'NIS / NISN tidak boleh kosong!' };
  if (!siswa.nama.trim()) return { success: false, message: 'Nama siswa tidak boleh kosong!' };
  if (!siswa.kelas.trim()) return { success: false, message: 'Kelas siswa tidak boleh kosong!' };

  const students = loadStudents();
  if (students.some((s) => s.nis === nisClean)) {
    return { success: false, message: `Siswa dengan NIS ${nisClean} sudah terdaftar!` };
  }

  let phone = siswa.waOrangtua ? String(siswa.waOrangtua).replace(/[^0-9]/g, '') : '';
  if (phone.startsWith('0')) phone = '62' + phone.substring(1);

  const newSiswa: Siswa = {
    nis: nisClean,
    nama: siswa.nama.trim(),
    kelas: siswa.kelas.trim(),
    waOrangtua: phone,
    waAktif: siswa.waAktif || 'YA',
  };

  students.push(newSiswa);
  students.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  saveStudents(students);

  return { success: true, message: `Siswa ${newSiswa.nama} (${newSiswa.kelas}) berhasil ditambahkan.` };
}

export function updateStudent(oldNis: string, updated: Siswa): { success: boolean; message: string } {
  const oldNisClean = normalizeNIS(oldNis);
  const newNisClean = normalizeNIS(updated.nis);
  if (!newNisClean) return { success: false, message: 'NIS baru tidak boleh kosong!' };
  if (!updated.nama.trim()) return { success: false, message: 'Nama siswa tidak boleh kosong!' };
  if (!updated.kelas.trim()) return { success: false, message: 'Kelas siswa tidak boleh kosong!' };

  const students = loadStudents();
  const idx = students.findIndex((s) => s.nis === oldNisClean);
  if (idx === -1) return { success: false, message: 'Data siswa tidak ditemukan!' };

  // Check if changing NIS and conflicts with another
  if (newNisClean !== oldNisClean && students.some((s) => s.nis === newNisClean)) {
    return { success: false, message: `NIS ${newNisClean} sudah digunakan oleh siswa lain!` };
  }

  let phone = updated.waOrangtua ? String(updated.waOrangtua).replace(/[^0-9]/g, '') : '';
  if (phone.startsWith('0')) phone = '62' + phone.substring(1);

  const updatedItem: Siswa = {
    nis: newNisClean,
    nama: updated.nama.trim(),
    kelas: updated.kelas.trim(),
    waOrangtua: phone,
    waAktif: updated.waAktif || 'YA',
  };

  students[idx] = updatedItem;
  students.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  saveStudents(students);

  // If NIS changed, also cascade to AbsenRecords & Keterangan
  if (newNisClean !== oldNisClean) {
    const abs = loadAbsenRecords();
    let absChanged = false;
    abs.forEach((a) => {
      if (normalizeNIS(a.nis) === oldNisClean) {
        a.nis = newNisClean;
        a.namaSiswa = updatedItem.nama;
        a.kelas = updatedItem.kelas;
        absChanged = true;
      }
    });
    if (absChanged) saveAbsenRecords(abs);

    const kets = loadKeteranganRecords();
    let ketChanged = false;
    kets.forEach((k) => {
      if (normalizeNIS(k.nis) === oldNisClean) {
        k.nis = newNisClean;
        k.namaSiswa = updatedItem.nama;
        k.kelas = updatedItem.kelas;
        ketChanged = true;
      }
    });
    if (ketChanged) saveKeteranganRecords(kets);
  }

  return { success: true, message: `Data siswa ${updatedItem.nama} berhasil diperbarui.` };
}

export function deleteStudent(nis: string): { success: boolean; message: string } {
  const clean = normalizeNIS(nis);
  const students = loadStudents();
  const target = students.find((s) => s.nis === clean);
  if (!target) return { success: false, message: 'Siswa tidak ditemukan.' };

  const filtered = students.filter((s) => s.nis !== clean);
  saveStudents(filtered);
  return { success: true, message: `Siswa ${target.nama} berhasil dihapus dari sistem.` };
}

export function importStudents(
  importedList: Siswa[],
  mode: 'append' | 'replace'
): { success: boolean; count: number; message: string } {
  if (!Array.isArray(importedList) || importedList.length === 0) {
    return { success: false, count: 0, message: 'Daftar impor kosong.' };
  }

  const existing = mode === 'replace' ? [] : loadStudents();
  const existingMap = new Map<string, Siswa>();
  existing.forEach((s) => existingMap.set(normalizeNIS(s.nis), s));

  let addedCount = 0;
  importedList.forEach((raw) => {
    const nis = normalizeNIS(raw.nis);
    if (!nis || !raw.nama) return;

    let phone = raw.waOrangtua ? String(raw.waOrangtua).replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const s: Siswa = {
      nis,
      nama: String(raw.nama).trim(),
      kelas: String(raw.kelas || 'Umum').trim(),
      waOrangtua: phone,
      waAktif: raw.waAktif || 'YA',
    };

    existingMap.set(nis, s);
    addedCount++;
  });

  const finalStudents = Array.from(existingMap.values());
  finalStudents.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  saveStudents(finalStudents);

  return {
    success: true,
    count: addedCount,
    message: `Berhasil mengimpor ${addedCount} data siswa (Total saat ini: ${finalStudents.length} siswa).`,
  };
}

// --- Absen Records Management ---
export function addManualAbsenRecord(rec: {
  tanggal: string;
  nis: string;
  jamDatang?: string;
  jamPulang?: string;
  status: string;
}): { success: boolean; message: string } {
  const nisClean = normalizeNIS(rec.nis);
  const students = loadStudents();
  const student = students.find((s) => s.nis === nisClean);
  if (!student) return { success: false, message: 'Siswa dengan NIS tersebut tidak ditemukan!' };

  const records = loadAbsenRecords();
  const tgl = rec.tanggal || getTodayString();
  const existingIdx = records.findIndex((r) => r.tanggal === tgl && normalizeNIS(r.nis) === nisClean);

  const newRec: AbsenRecord = {
    id: `rec-${tgl}-${nisClean}-${Date.now()}`,
    timestamp: `${tgl}T${rec.jamDatang && rec.jamDatang !== '-' ? rec.jamDatang : getCurrentTimeString()}`,
    tanggal: tgl,
    nis: nisClean,
    namaSiswa: student.nama,
    kelas: student.kelas,
    jamDatang: rec.jamDatang || '-',
    jamPulang: rec.jamPulang || '-',
    status: rec.status.toUpperCase(),
  };

  if (existingIdx !== -1) {
    records[existingIdx] = newRec;
  } else {
    records.push(newRec);
  }
  saveAbsenRecords(records);

  return { success: true, message: `Absensi untuk ${student.nama} pada ${tgl} berhasil dicatat.` };
}

export function updateAbsenRecord(
  id: string,
  updated: Partial<AbsenRecord>
): { success: boolean; message: string } {
  const records = loadAbsenRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return { success: false, message: 'Catatan absensi tidak ditemukan.' };

  records[idx] = { ...records[idx], ...updated };
  saveAbsenRecords(records);
  return { success: true, message: 'Catatan absensi berhasil diperbarui.' };
}

export function deleteAbsenRecord(id: string): { success: boolean; message: string } {
  const records = loadAbsenRecords();
  const filtered = records.filter((r) => r.id !== id);
  saveAbsenRecords(filtered);
  return { success: true, message: 'Catatan absensi berhasil dihapus.' };
}

// --- Log WA Management ---
export function deleteLogWARecord(id: string): { success: boolean; message: string } {
  const logs = loadLogWARecords();
  const filtered = logs.filter((l) => l.id !== id);
  saveLogWARecords(filtered);
  return { success: true, message: 'Log pesan WA berhasil dihapus.' };
}

export function clearLogWA(): { success: boolean; message: string } {
  saveLogWARecords([]);
  return { success: true, message: 'Semua log WhatsApp berhasil dibersihkan.' };
}

export function toggleLogWAStatus(id: string): { success: boolean; message: string } {
  const logs = loadLogWARecords();
  const target = logs.find((l) => l.id === id);
  if (!target) return { success: false, message: 'Log tidak ditemukan.' };

  if (target.statusProses === 'SUDAH DIPROSES') {
    target.statusProses = 'BELUM DIPROSES';
    target.waktuProses = undefined;
  } else {
    target.statusProses = 'SUDAH DIPROSES';
    target.waktuProses = getCurrentTimeString();
  }
  saveLogWARecords(logs);
  return { success: true, message: `Status log diubah menjadi ${target.statusProses}.` };
}

export function prosesSemuaLogWA(): { success: boolean; count: number; message: string } {
  const logs = loadLogWARecords();
  let count = 0;
  logs.forEach((l) => {
    if (l.statusProses !== 'SUDAH DIPROSES') {
      l.statusProses = 'SUDAH DIPROSES';
      l.waktuProses = getCurrentTimeString();
      count++;
    }
  });
  saveLogWARecords(logs);
  return {
    success: true,
    count,
    message: `${count} log WhatsApp berhasil ditandai SUDAH DIPROSES.`,
  };
}

// --- Backup & Restore Database ---
export function exportFullDatabaseJSON(): string {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '3.0',
    settings: loadSettings(),
    students: loadStudents(),
    absenRecords: loadAbsenRecords(),
    keteranganRecords: loadKeteranganRecords(),
    logWARecords: loadLogWARecords(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Format file JSON tidak valid!' };
    }
    if (data.settings) saveSettings(data.settings);
    if (Array.isArray(data.students)) saveStudents(data.students);
    if (Array.isArray(data.absenRecords)) saveAbsenRecords(data.absenRecords);
    if (Array.isArray(data.keteranganRecords)) saveKeteranganRecords(data.keteranganRecords);
    if (Array.isArray(data.logWARecords)) saveLogWARecords(data.logWARecords);

    return {
      success: true,
      message: `Database berhasil dipulihkan! (${data.students?.length || 0} siswa, ${data.absenRecords?.length || 0} riwayat absen).`,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal membaca file backup: ${e?.message || 'Error'}` };
  }
}

// Student lookup by QR code or manual input
export function getStudentFromQR(qrInput: string): Siswa | null {
  const input = String(qrInput ?? '').trim();
  if (!input) return null;

  const students = loadStudents();

  // If input format is "NIS|Nama|Kelas"
  if (input.includes('|')) {
    const parts = input.split('|');
    const nis = normalizeNIS(parts[0]);
    if (!nis) return null;
    const found = students.find((s) => s.nis === nis);
    if (found) return found;
    return {
      nis,
      nama: parts[1] ? parts[1].trim() : nis,
      kelas: parts[2] ? parts[2].trim() : '-',
      waOrangtua: '',
      waAktif: 'YA',
    };
  }

  const normalized = normalizeNIS(input);
  return students.find((s) => s.nis === normalized) || null;
}

// Catat Absen - Matches GAS catatAbsen logic exactly
export function catatAbsen(
  qrInput: string,
  tipeAbsen: 'DATANG' | 'PULANG' | 'IZIN_PULANG',
  alasanIzin?: string
): {
  success: boolean;
  message: string;
  nama: string;
  kelas?: string;
  jam?: string;
  status?: string;
  isTerlambat?: boolean;
} {
  const inputClean = String(qrInput ?? '').trim();
  if (!inputClean) {
    return {
      success: false,
      message: '⚠️ QR Code tidak terbaca!',
      nama: 'QR Code tidak terbaca!',
    };
  }

  const siswa = getStudentFromQR(inputClean);
  if (!siswa) {
    return {
      success: false,
      message: '⚠️ Siswa Tidak Ditemukan di Database!',
      nama: 'Siswa Tidak Ditemukan',
    };
  }

  const todayStr = getTodayString();
  const timeStr = getCurrentTimeString();
  const records = loadAbsenRecords();
  const existingIdx = records.findIndex(
    (r) => r.tanggal === todayStr && r.nis === siswa.nis
  );
  const existing = existingIdx !== -1 ? records[existingIdx] : null;

  if (tipeAbsen === 'DATANG') {
    if (existing && existing.jamDatang && existing.jamDatang !== '-') {
      return {
        success: false,
        message: `⚠️ ${siswa.nama} SUDAH absen datang hari ini!`,
        nama: siswa.nama,
      };
    }

    const settings = loadSettings();
    const isTerlambat = timeStr > settings.batasDatang;
    const statusDatang = isTerlambat ? 'TERLAMBAT' : 'HADIR';

    const newRecord: AbsenRecord = {
      id: `rec-${todayStr}-${siswa.nis}-${Date.now()}`,
      timestamp: `${todayStr}T${timeStr}`,
      tanggal: todayStr,
      nis: siswa.nis,
      namaSiswa: siswa.nama,
      kelas: siswa.kelas,
      jamDatang: timeStr,
      jamPulang: existing?.jamPulang || '-',
      status: statusDatang,
    };

    if (existingIdx !== -1) {
      records[existingIdx] = newRecord;
    } else {
      records.push(newRecord);
    }
    saveAbsenRecords(records);

    return {
      success: true,
      message: `${isTerlambat ? '🟡' : '🟢'} ABSEN DATANG [${statusDatang}]: ${siswa.nama} (${siswa.kelas}) - ${timeStr}`,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jam: timeStr,
      status: statusDatang,
      isTerlambat,
    };
  }

  if (tipeAbsen === 'PULANG') {
    if (!existing || existing.jamDatang === '-') {
      // PULANG TANPA DATANG
      const newRecord: AbsenRecord = {
        id: `rec-${todayStr}-${siswa.nis}-${Date.now()}`,
        timestamp: `${todayStr}T${timeStr}`,
        tanggal: todayStr,
        nis: siswa.nis,
        namaSiswa: siswa.nama,
        kelas: siswa.kelas,
        jamDatang: '-',
        jamPulang: timeStr,
        status: 'PULANG TANPA DATANG',
      };
      records.push(newRecord);
      saveAbsenRecords(records);

      return {
        success: true,
        message: `🟠 ABSEN PULANG: ${siswa.nama} (${siswa.kelas}) - ${timeStr} [PULANG TANPA DATANG]`,
        nama: siswa.nama,
        kelas: siswa.kelas,
        jam: timeStr,
        status: 'PULANG TANPA DATANG',
      };
    }

    if (existing.jamPulang && existing.jamPulang !== '-') {
      return {
        success: false,
        message: `⚠️ ${siswa.nama} SUDAH absen pulang hari ini (${existing.jamPulang})!`,
        nama: siswa.nama,
      };
    }

    const currentStatus = String(existing.status || '').toUpperCase();
    const statusAkhir = currentStatus.includes('TERLAMBAT')
      ? 'HADIR (TERLAMBAT)'
      : 'HADIR';

    existing.jamPulang = timeStr;
    existing.status = statusAkhir;
    records[existingIdx] = existing;
    saveAbsenRecords(records);

    return {
      success: true,
      message: `🔵 ABSEN PULANG [${statusAkhir}]: ${siswa.nama} (${siswa.kelas}) - ${timeStr}`,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jam: timeStr,
      status: statusAkhir,
    };
  }

  if (tipeAbsen === 'IZIN_PULANG') {
    const ketIzin = alasanIzin ? String(alasanIzin).trim() : 'Sakit/Keperluan Mendadak';
    const statusIzin = `IZIN PULANG (${ketIzin})`;

    if (!existing || existing.jamDatang === '-') {
      return {
        success: false,
        message: `⚠️ ${siswa.nama} belum melakukan absen DATANG. Pulang cepat hanya dapat dicatat untuk siswa yang sudah hadir.`,
        nama: siswa.nama,
      };
    }

    if (existing.jamPulang && existing.jamPulang !== '-') {
      return {
        success: false,
        message: `⚠️ ${siswa.nama} sudah memiliki jam PULANG (${existing.jamPulang}).`,
        nama: siswa.nama,
      };
    }

    existing.jamPulang = timeStr;
    existing.status = statusIzin;
    records[existingIdx] = existing;
    saveAbsenRecords(records);

    return {
      success: true,
      message: `🟣 IZIN PULANG (${ketIzin}): ${siswa.nama} (${siswa.kelas}) - ${timeStr}`,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jam: timeStr,
      status: statusIzin,
    };
  }

  return {
    success: false,
    message: 'Jenis absensi tidak dikenal.',
    nama: siswa.nama,
  };
}

// Simpan Keterangan Sakit / Izin
export function simpanKeteranganAbsensi(
  tanggal: string,
  nis: string,
  keterangan: 'SAKIT' | 'IZIN',
  catatan?: string,
  admin?: string
): { success: boolean; message: string } {
  const tanggalClean = String(tanggal || '').substring(0, 10);
  const nisClean = normalizeNIS(nis);
  if (!tanggalClean) return { success: false, message: 'Tanggal belum dipilih.' };
  if (!nisClean) return { success: false, message: 'NIS belum dipilih.' };

  const students = loadStudents();
  const student = students.find((s) => s.nis === nisClean);
  if (!student) return { success: false, message: 'Siswa tidak ditemukan di Data_Siswa.' };

  const records = loadKeteranganRecords();
  const existingIdx = records.findIndex(
    (k) => k.tanggal === tanggalClean && k.nis === nisClean
  );

  const newEntry: KeteranganRecord = {
    id: `ket-${tanggalClean}-${nisClean}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    tanggal: tanggalClean,
    nis: nisClean,
    namaSiswa: student.nama,
    kelas: student.kelas,
    keterangan,
    catatan: catatan ? catatan.trim() : '',
    admin: admin ? admin.trim() : 'Admin',
  };

  if (existingIdx !== -1) {
    records[existingIdx] = newEntry;
  } else {
    records.push(newEntry);
  }
  saveKeteranganRecords(records);

  return {
    success: true,
    message: `${student.nama} berhasil diberi keterangan ${keterangan}.`,
  };
}

// Hapus Keterangan Sakit / Izin
export function hapusKeteranganAbsensi(
  tanggal: string,
  nis: string
): { success: boolean; message: string } {
  const tanggalClean = String(tanggal || '').substring(0, 10);
  const nisClean = normalizeNIS(nis);
  const records = loadKeteranganRecords();
  const filtered = records.filter(
    (k) => !(k.tanggal === tanggalClean && k.nis === nisClean)
  );
  saveKeteranganRecords(filtered);
  return { success: true, message: 'Keterangan berhasil dihapus.' };
}

// Build Dashboard Data matching Google Apps Script logic exactly
export function getDashboardData(targetDate?: string): DashboardData {
  const todayStr = getTodayString();
  const timeNowStr = getCurrentTimeString();
  const selectedDate = targetDate ? String(targetDate).substring(0, 10) : todayStr;
  const settings = loadSettings();

  const isPastBatasAlfa =
    selectedDate < todayStr || (selectedDate === todayStr && timeNowStr >= settings.batasAlfa);
  const isPastBatasPulang =
    selectedDate < todayStr || (selectedDate === todayStr && timeNowStr >= settings.batasPulang);

  const students = loadStudents();
  const allAbsenRecords = loadAbsenRecords();
  const allKeterangan = loadKeteranganRecords();

  const siswaMap: { [nis: string]: StudentAbsenStatus } = {};
  const rekapKelas: RekapKelasData = {};

  students.forEach((s) => {
    siswaMap[s.nis] = {
      nisn: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      tanggal: selectedDate,
      jamDatang: '-',
      jamPulang: '-',
      status: 'BELUM ABSEN',
      keterangan: '',
    };

    if (!rekapKelas[s.kelas]) {
      rekapKelas[s.kelas] = {
        hadir: 0,
        totalHadir: 0,
        bolos: 0,
        alfa: 0,
        sakit: 0,
        izin: 0,
        izinPulang: 0,
        belum: 0,
        pulangTanpaDatang: 0,
      };
    }
  });

  // Read Sheet5 records for selectedDate
  allAbsenRecords.forEach((rec) => {
    if (rec.tanggal !== selectedDate) return;
    const nis = normalizeNIS(rec.nis);
    if (!siswaMap[nis]) return;

    const student = siswaMap[nis];
    student.jamDatang = rec.jamDatang || '-';
    student.jamPulang = rec.jamPulang || '-';
    let status = (rec.status || '').toUpperCase().trim() || 'HADIR';

    // Bolos check: Has jamDatang, no jamPulang, and past BATAS_PULANG
    if (
      student.jamDatang !== '-' &&
      student.jamDatang !== '' &&
      (student.jamPulang === '-' || student.jamPulang === '') &&
      isPastBatasPulang
    ) {
      status = 'BOLOS';
    }

    student.status = status;
  });

  // Apply Keterangan_Absensi for selectedDate (SAKIT / IZIN overrides)
  allKeterangan.forEach((k) => {
    if (k.tanggal !== selectedDate) return;
    const nis = normalizeNIS(k.nis);
    if (!siswaMap[nis]) return;

    siswaMap[nis].status = k.keterangan;
    siswaMap[nis].keterangan = k.keterangan;
    siswaMap[nis].catatan = k.catatan;
    siswaMap[nis].admin = k.admin;
  });

  // Infer ALFA: If past BATAS_ALFA, no scan datang/pulang, no SAKIT/IZIN
  Object.values(siswaMap).forEach((s) => {
    if (s.keterangan === 'SAKIT' || s.keterangan === 'IZIN') return;

    if (
      s.jamDatang === '-' &&
      s.jamPulang === '-' &&
      s.status === 'BELUM ABSEN' &&
      isPastBatasAlfa
    ) {
      s.status = 'ALFA / TANPA KETERANGAN';
    }
  });

  // Calculate Statistics & Class Breakdown
  let totalHadirTepat = 0;
  let totalTerlambat = 0;
  let totalBelumAbsen = 0;
  let totalBolos = 0;
  let totalAlfa = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalIzinPulang = 0;
  let totalPulangTanpaDatang = 0;

  Object.values(siswaMap).forEach((s) => {
    const status = String(s.status || '').toUpperCase();
    const kelasData = rekapKelas[s.kelas] || {
      hadir: 0,
      totalHadir: 0,
      bolos: 0,
      alfa: 0,
      sakit: 0,
      izin: 0,
      izinPulang: 0,
      belum: 0,
      pulangTanpaDatang: 0,
    };

    if (status === 'SAKIT') {
      totalSakit++;
      kelasData.sakit++;
    } else if (status === 'IZIN') {
      totalIzin++;
      kelasData.izin++;
    } else if (status.includes('IZIN PULANG')) {
      totalIzinPulang++;
      kelasData.izinPulang++;
    } else if (status.includes('BOLOS')) {
      totalBolos++;
      kelasData.bolos++;
    } else if (status.includes('ALFA') || status.includes('TANPA KETERANGAN')) {
      totalAlfa++;
      kelasData.alfa++;
    } else if (status.includes('PULANG TANPA DATANG')) {
      totalPulangTanpaDatang++;
      kelasData.pulangTanpaDatang++;
    } else if (status.includes('TERLAMBAT')) {
      totalTerlambat++;
      kelasData.hadir++;
      kelasData.totalHadir++;
    } else if (status.includes('HADIR')) {
      totalHadirTepat++;
      kelasData.hadir++;
      kelasData.totalHadir++;
    } else {
      totalBelumAbsen++;
      kelasData.belum++;
    }
  });

  const totalHadir = totalHadirTepat + totalTerlambat;
  const totalSiswa = students.length;
  const persentaseHadir =
    totalSiswa > 0 ? ((totalHadir / totalSiswa) * 100).toFixed(1) : 0;

  // Siswa Terlambat List
  const listTerlambat = Object.values(siswaMap)
    .filter((s) => String(s.status || '').toUpperCase().includes('TERLAMBAT'))
    .sort((a, b) => a.jamDatang.localeCompare(b.jamDatang))
    .map((s) => ({
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas,
      jamDatang: s.jamDatang,
      status: s.status,
    }));

  // Monthly Trend Calculation
  const targetMonth = selectedDate.substring(0, 7);
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const namaBulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNameText = `${namaBulanIndo[month - 1]} ${year}`;

  const labels: number[] = [];
  const trendTotalHadir: number[] = [];
  const trendHadirTepat: number[] = [];
  const trendTerlambat: number[] = [];
  const trendSakit: number[] = [];
  const trendIzin: number[] = [];
  const trendIzinPulang: number[] = [];
  const trendAlfa: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayPad = String(d).padStart(2, '0');
    const dateStr = `${targetMonth}-${dayPad}`;
    labels.push(d);

    let hTepat = 0;
    let terl = 0;
    let skt = 0;
    let izn = 0;
    let iznPlg = 0;
    let alf = 0;

    allAbsenRecords.forEach((r) => {
      if (r.tanggal !== dateStr) return;
      const st = (r.status || '').toUpperCase();
      if (st.includes('TERLAMBAT')) {
        terl++;
      } else if (st.includes('HADIR') || (r.jamDatang && r.jamDatang !== '-')) {
        hTepat++;
      }
      if (st.includes('IZIN PULANG')) {
        iznPlg++;
      }
    });

    allKeterangan.forEach((k) => {
      if (k.tanggal !== dateStr) return;
      if (k.keterangan === 'SAKIT') skt++;
      if (k.keterangan === 'IZIN') izn++;
    });

    trendLabelsPush: {
      trendTotalHadir.push(hTepat + terl);
      trendHadirTepat.push(hTepat);
      trendTerlambat.push(terl);
      trendSakit.push(skt);
      trendIzin.push(izn);
      trendIzinPulang.push(iznPlg);
      trendAlfa.push(alf);
    }
  }

  // Rekap Riwayat Per Siswa (aggregating from REKAP_MULAI_DATE)
  const rekapSiswa = buildRekapSiswa(
    students,
    allAbsenRecords,
    allKeterangan,
    todayStr,
    timeNowStr
  );

  return {
    todayDate: todayStr,
    selectedDate,
    rekapMulaiDate: REKAP_MULAI_DATE,
    batasAlfa: BATAS_ALFA,
    batasPulang: BATAS_PULANG,
    isPastBatasAlfa,
    stats: {
      totalSiswa,
      totalHadir,
      totalHadirTepat,
      totalTerlambat,
      totalBolos,
      totalAlfa,
      totalSakit,
      totalIzin,
      totalIzinPulang,
      totalBelumAbsen,
      totalPulangTanpaDatang,
      persentaseHadir,
    },
    rekapKelas,
    listTerlambat,
    dailyTrend: {
      monthName: monthNameText,
      labels,
      totalHadir: trendTotalHadir,
      hadirTepat: trendHadirTepat,
      terlambat: trendTerlambat,
      sakit: trendSakit,
      izin: trendIzin,
      izinPulang: trendIzinPulang,
      alfa: trendAlfa,
    },
    listSiswa: Object.values(siswaMap),
    rekapSiswa,
  };
}

// Build student violation history
function buildRekapSiswa(
  students: Siswa[],
  allAbsenRecords: AbsenRecord[],
  allKeterangan: KeteranganRecord[],
  todayStr: string,
  timeNowStr: string
): RekapSiswaItem[] {
  const rekapMap: { [nis: string]: RekapSiswaItem } = {};
  const studentDates: {
    [nis: string]: {
      [tanggal: string]: { jamDatang: string; jamPulang: string; status: string };
    };
  } = {};
  const activeDates: { [tanggal: string]: boolean } = {};

  students.forEach((s) => {
    rekapMap[s.nis] = {
      nisn: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      terlambat: 0,
      bolos: 0,
      alfa: 0,
      sakit: 0,
      izin: 0,
      izinPulang: 0,
      pulangTanpaDatang: 0,
      totalPelanggaran: 0,
    };
    studentDates[s.nis] = {};
  });

  const settings = loadSettings();
  allAbsenRecords.forEach((r) => {
    if (r.tanggal < settings.rekapMulaiDate) return;
    const nis = normalizeNIS(r.nis);
    if (!rekapMap[nis]) return;
    activeDates[r.tanggal] = true;

    if (!studentDates[nis][r.tanggal]) {
      studentDates[nis][r.tanggal] = { jamDatang: '-', jamPulang: '-', status: '' };
    }
    const item = studentDates[nis][r.tanggal];
    if (r.jamDatang && r.jamDatang !== '-') item.jamDatang = r.jamDatang;
    if (r.jamPulang && r.jamPulang !== '-') item.jamPulang = r.jamPulang;
    if (r.status) item.status = r.status.toUpperCase().trim();
  });

  allKeterangan.forEach((k) => {
    if (k.tanggal < settings.rekapMulaiDate) return;
    const nis = normalizeNIS(k.nis);
    if (!rekapMap[nis]) return;
    activeDates[k.tanggal] = true;

    if (!studentDates[nis][k.tanggal]) {
      studentDates[nis][k.tanggal] = { jamDatang: '-', jamPulang: '-', status: '' };
    }
    studentDates[nis][k.tanggal].status = k.keterangan;
  });

  function isPastAlfa(date: string) {
    return date < todayStr || (date === todayStr && timeNowStr >= settings.batasAlfa);
  }
  function isPastPulang(date: string) {
    return date < todayStr || (date === todayStr && timeNowStr >= settings.batasPulang);
  }

  // Count per student
  Object.keys(rekapMap).forEach((nis) => {
    const rekap = rekapMap[nis];
    const dates = studentDates[nis] || {};

    Object.keys(dates).forEach((tgl) => {
      const record = dates[tgl];
      const status = String(record.status || '').toUpperCase();
      const adaDatang = record.jamDatang && record.jamDatang !== '-';
      const adaPulang = record.jamPulang && record.jamPulang !== '-';

      if (status === 'SAKIT') {
        rekap.sakit++;
        return;
      }
      if (status === 'IZIN') {
        rekap.izin++;
        return;
      }
      if (status.includes('IZIN PULANG')) {
        rekap.izinPulang++;
        return;
      }
      if (status.includes('TERLAMBAT')) {
        rekap.terlambat++;
      }
      if (status.includes('PULANG TANPA DATANG')) {
        rekap.pulangTanpaDatang++;
      }
      if (status.includes('BOLOS') || (adaDatang && !adaPulang && isPastPulang(tgl))) {
        rekap.bolos++;
      }
      if (status.includes('ALFA') || status.includes('TANPA KETERANGAN')) {
        rekap.alfa++;
      }
    });
  });

  // Automated ALFA for active dates with no attendance and no note
  Object.keys(activeDates).forEach((tgl) => {
    if (!isPastAlfa(tgl)) return;

    Object.keys(rekapMap).forEach((nis) => {
      const existing = studentDates[nis]?.[tgl];
      if (!existing) {
        rekapMap[nis].alfa++;
        return;
      }
      const st = String(existing.status || '').toUpperCase();
      if (!st && existing.jamDatang === '-' && existing.jamPulang === '-') {
        rekapMap[nis].alfa++;
      }
    });
  });

  const list = Object.values(rekapMap);
  list.forEach((r) => {
    r.totalPelanggaran =
      Number(r.terlambat || 0) +
      Number(r.bolos || 0) +
      Number(r.alfa || 0) +
      Number(r.pulangTanpaDatang || 0);
  });

  return list.sort((a, b) => {
    if (b.totalPelanggaran !== a.totalPelanggaran) {
      return b.totalPelanggaran - a.totalPelanggaran;
    }
    return a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' });
  });
}

// WhatsApp Batch Message Generator (without external API, generates wa.me/send?phone=... links)
export function getWhatsAppBatch(tanggal?: string, eventFilter?: string): WABatchResult {
  const todayStr = getTodayString();
  const date = tanggal || todayStr;
  const timeNow = getCurrentTimeString();
  const allowed = eventFilter
    ? [String(eventFilter).toUpperCase()]
    : ['ALFA', 'BOLOS'];

  const students = loadStudents();
  const allAbsen = loadAbsenRecords();
  const allKet = loadKeteranganRecords();
  const logs = loadLogWARecords();

  const absensiMap: { [nis: string]: AbsenRecord } = {};
  allAbsen.forEach((r) => {
    if (r.tanggal === date) absensiMap[normalizeNIS(r.nis)] = r;
  });

  const ketMap: { [nis: string]: KeteranganRecord } = {};
  allKet.forEach((k) => {
    if (k.tanggal === date) ketMap[normalizeNIS(k.nis)] = k;
  });

  const logMap: { [key: string]: LogWARecord } = {};
  logs.forEach((l) => {
    if (l.tanggal === date) {
      logMap[`${l.nis}|${l.event}`] = l;
    }
  });

  const items: WABatchItem[] = [];

  students.forEach((s) => {
    const phone = s.waOrangtua ? s.waOrangtua.replace(/[^\d]/g, '') : '';
    if (!phone) return;

    let event = '';
    let status = '';
    let jam = '-';
    const abs = absensiMap[s.nis];

    if (
      allowed.includes('ALFA') &&
      (!date || date !== todayStr || timeNow >= BATAS_ALFA) &&
      !abs &&
      !ketMap[s.nis]
    ) {
      event = 'ALFA';
      status = 'ALFA / TANPA KETERANGAN';
    } else if (
      allowed.includes('BOLOS') &&
      (!date || date !== todayStr || timeNow >= BATAS_PULANG) &&
      abs &&
      abs.jamDatang !== '-' &&
      abs.jamPulang === '-'
    ) {
      event = 'BOLOS';
      status = 'BOLOS';
      jam = abs.jamDatang || '-';
    }

    if (!event) return;

    const key = `${s.nis}|${event}`;
    const log = logMap[key];
    const processed = log && log.statusProses === 'SUDAH DIPROSES';

    const text =
      `🔔 *INFORMASI ABSENSI SISWA*\n\n` +
      `Nama   : ${s.nama}\n` +
      `Kelas  : ${s.kelas}\n` +
      `Tanggal: ${date}\n` +
      `Jam    : ${jam}\n` +
      `Status : *${status}*\n\n` +
      `Keterangan: ${event === 'ALFA' ? 'ALFA / TANPA KETERANGAN' : 'BOLOS'}\n\n` +
      `Mohon perhatian bapak/ibu orang tua/wali terhadap kehadiran siswa di sekolah.\n\n` +
      `SMA NEGERI 05 BOMBANA`;

    const targetPhone = phone.startsWith('0')
      ? `62${phone.substring(1)}`
      : phone.startsWith('62')
      ? phone
      : `62${phone}`;
    const url = `https://web.whatsapp.com/send?phone=${encodeURIComponent(
      targetPhone
    )}&text=${encodeURIComponent(text)}`;

    items.push({
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      phone: targetPhone,
      jenis: event,
      status,
      jam,
      tanggal: date,
      url,
      statusProses: processed ? 'SUDAH DIPROSES' : 'BELUM DIPROSES',
      waktuProses: log?.waktuProses,
    });
  });

  return {
    success: true,
    tanggal: date,
    filter: allowed,
    total: items.length,
    sudahDiproses: items.filter((x) => x.statusProses === 'SUDAH DIPROSES').length,
    belumDiproses: items.filter((x) => x.statusProses !== 'SUDAH DIPROSES').length,
    items,
    message: `${items.length} pesan ${allowed.join('/')} ditemukan.`,
  };
}

export function markWhatsAppProcessedBatch(
  items: Array<{
    nis: string;
    event?: string;
    jenis?: string;
    tanggal?: string;
    nama?: string;
    kelas?: string;
    phone?: string;
  }>
): { success: boolean; processed: number; message: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: true, processed: 0, message: 'Tidak ada pesan yang diproses.' };
  }

  const logs = loadLogWARecords();
  const now = new Date();
  const waktu = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`;
  let count = 0;

  items.forEach((item) => {
    const nis = normalizeNIS(item.nis);
    const event = (item.event || item.jenis || '').toUpperCase() as 'ALFA' | 'BOLOS';
    const tanggal = item.tanggal || getTodayString();
    if (!nis || !event) return;

    const existingIdx = logs.findIndex(
      (l) => l.nis === nis && l.event === event && l.tanggal === tanggal
    );
    if (existingIdx !== -1) {
      logs[existingIdx].statusProses = 'SUDAH DIPROSES';
      logs[existingIdx].waktuProses = waktu;
    } else {
      logs.push({
        id: `wa-${tanggal}-${nis}-${event}`,
        timestamp: now.toISOString(),
        tanggal,
        nis,
        namaSiswa: item.nama || '-',
        kelas: item.kelas || '-',
        event,
        nomorWA: item.phone || '-',
        statusProses: 'SUDAH DIPROSES',
        waktuProses: waktu,
        catatan: 'WhatsApp dibuka oleh browser.',
      });
    }
    count++;
  });

  saveLogWARecords(logs);
  return {
    success: true,
    processed: count,
    message: `${count} pesan berhasil ditandai SUDAH DIPROSES.`,
  };
}

// Download Riwayat Absensi Siswa - Report builder
export function getRiwayatSiswaDownload(nis: string): RiwayatSiswaReport {
  const nisClean = normalizeNIS(nis);
  const students = loadStudents();
  const student = students.find((s) => s.nis === nisClean);
  if (!student) {
    throw new Error('Siswa tidak ditemukan di Data_Siswa.');
  }

  const todayStr = getTodayString();
  const timeNowStr = getCurrentTimeString();
  const allAbsen = loadAbsenRecords();
  const allKet = loadKeteranganRecords();

  const riwayatMap: {
    [tgl: string]: {
      tanggal: string;
      nisn: string;
      nama: string;
      kelas: string;
      jamDatang: string;
      jamPulang: string;
      status: string;
      keterangan: string;
      catatan: string;
      admin: string;
    };
  } = {};
  const activeDates: { [tgl: string]: boolean } = {};

  const settings = loadSettings();
  allAbsen.forEach((r) => {
    if (r.tanggal < settings.rekapMulaiDate) return;
    activeDates[r.tanggal] = true;
    if (normalizeNIS(r.nis) !== nisClean) return;

    if (!riwayatMap[r.tanggal]) {
      riwayatMap[r.tanggal] = {
        tanggal: r.tanggal,
        nisn: nisClean,
        nama: student.nama,
        kelas: student.kelas,
        jamDatang: r.jamDatang || '-',
        jamPulang: r.jamPulang || '-',
        status: (r.status || '').toUpperCase(),
        keterangan: '-',
        catatan: '-',
        admin: '-',
      };
    } else {
      if (r.jamDatang && r.jamDatang !== '-') riwayatMap[r.tanggal].jamDatang = r.jamDatang;
      if (r.jamPulang && r.jamPulang !== '-') riwayatMap[r.tanggal].jamPulang = r.jamPulang;
      if (r.status) riwayatMap[r.tanggal].status = r.status.toUpperCase();
    }
  });

  allKet.forEach((k) => {
    if (k.tanggal < REKAP_MULAI_DATE) return;
    activeDates[k.tanggal] = true;
    if (normalizeNIS(k.nis) !== nisClean) return;

    if (!riwayatMap[k.tanggal]) {
      riwayatMap[k.tanggal] = {
        tanggal: k.tanggal,
        nisn: nisClean,
        nama: student.nama,
        kelas: student.kelas,
        jamDatang: '-',
        jamPulang: '-',
        status: k.keterangan,
        keterangan: k.keterangan,
        catatan: k.catatan || '-',
        admin: k.admin || '-',
      };
    } else {
      riwayatMap[k.tanggal].status = k.keterangan;
      riwayatMap[k.tanggal].keterangan = k.keterangan;
      riwayatMap[k.tanggal].catatan = k.catatan || '-';
      riwayatMap[k.tanggal].admin = k.admin || '-';
    }
  });

  function isPastAlfa(tgl: string) {
    return tgl < todayStr || (tgl === todayStr && timeNowStr >= BATAS_ALFA);
  }
  function isPastPulang(tgl: string) {
    return tgl < todayStr || (tgl === todayStr && timeNowStr >= BATAS_PULANG);
  }

  Object.keys(activeDates).forEach((tgl) => {
    if (!riwayatMap[tgl]) {
      riwayatMap[tgl] = {
        tanggal: tgl,
        nisn: nisClean,
        nama: student.nama,
        kelas: student.kelas,
        jamDatang: '-',
        jamPulang: '-',
        status: isPastAlfa(tgl) ? 'ALFA / TANPA KETERANGAN' : 'BELUM ABSEN',
        keterangan: '-',
        catatan: '-',
        admin: '-',
      };
      return;
    }

    const item = riwayatMap[tgl];
    const st = item.status;
    if (st === 'SAKIT' || st === 'IZIN' || st.includes('PULANG TANPA DATANG')) return;
    const adaDatang = item.jamDatang && item.jamDatang !== '-';
    const adaPulang = item.jamPulang && item.jamPulang !== '-';

    if (st.includes('BOLOS') || (adaDatang && !adaPulang && isPastPulang(tgl))) {
      item.status = 'BOLOS';
      return;
    }
    if (!adaDatang && !adaPulang && isPastAlfa(tgl)) {
      item.status = 'ALFA / TANPA KETERANGAN';
      return;
    }
    if (!st && adaDatang) {
      item.status = 'HADIR';
    }
  });

  const sortedDates = Object.keys(riwayatMap).sort();
  const rows = sortedDates.map((tgl) => riwayatMap[tgl]);

  const summary = {
    hadir: 0,
    terlambat: 0,
    bolos: 0,
    alfa: 0,
    sakit: 0,
    izin: 0,
    pulangTanpaDatang: 0,
    izinPulang: 0,
    total: rows.length,
  };

  rows.forEach((r) => {
    const s = r.status.toUpperCase();
    if (s === 'HADIR' || s === 'HADIR TEPAT') summary.hadir++;
    if (s.includes('TERLAMBAT')) summary.terlambat++;
    if (s.includes('BOLOS')) summary.bolos++;
    if (s.includes('ALFA') || s.includes('TANPA KETERANGAN')) summary.alfa++;
    if (s === 'SAKIT') summary.sakit++;
    if (s === 'IZIN') summary.izin++;
    if (s.includes('PULANG TANPA DATANG')) summary.pulangTanpaDatang++;
    if (s.includes('IZIN PULANG')) summary.izinPulang++;
  });

  const filename = `Riwayat_Absensi_${nisClean}_${student.nama
    .replace(/[\\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)}.pdf`;

  return {
    success: true,
    filename,
    nisn: nisClean,
    nama: student.nama,
    kelas: student.kelas,
    periodeMulai: REKAP_MULAI_DATE,
    dibuatTanggal: todayStr,
    dibuatJam: timeNowStr,
    jumlah: rows.length,
    summary,
    rows,
  };
}
