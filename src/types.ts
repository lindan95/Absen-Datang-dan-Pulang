export interface Siswa {
  nis: string; // 10 digit normalized
  nama: string;
  kelas: string;
  waOrangtua: string;
  waAktif?: string;
}

export interface AbsenRecord {
  id: string;
  timestamp: string;
  tanggal: string; // yyyy-MM-dd
  nis: string;
  namaSiswa: string;
  kelas: string;
  jamDatang: string; // HH:mm:ss or '-'
  jamPulang: string;  // HH:mm:ss or '-'
  status: string;     // HADIR, TERLAMBAT, HADIR (TERLAMBAT), BOLOS, ALFA, PULANG TANPA DATANG, IZIN PULANG (ALASAN)
}

export interface KeteranganRecord {
  id: string;
  timestamp: string;
  tanggal: string;
  nis: string;
  namaSiswa: string;
  kelas: string;
  keterangan: 'SAKIT' | 'IZIN';
  catatan?: string;
  admin?: string;
}

export interface LogWARecord {
  id: string;
  timestamp: string;
  tanggal: string;
  nis: string;
  namaSiswa: string;
  kelas: string;
  event: 'ALFA' | 'BOLOS' | 'DATANG' | 'PULANG';
  nomorWA: string;
  statusProses: 'SUDAH DIPROSES' | 'BELUM DIPROSES';
  waktuProses?: string;
  catatan?: string;
}

export interface AppSettings {
  batasDatang: string; // HH:mm:ss e.g. '07:00:00'
  batasAlfa: string;   // HH:mm:ss e.g. '08:00:00'
  batasPulang: string; // HH:mm:ss e.g. '14:20:00'
  rekapMulaiDate: string; // yyyy-MM-dd e.g. '2026-08-25'
  namaSekolah: string;
  alamatSekolah: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  defaultAdmin: string;
  adminPin: string;
}

export interface StudentAbsenStatus {
  nisn: string;
  nama: string;
  kelas: string;
  tanggal: string;
  jamDatang: string;
  jamPulang: string;
  status: string;
  keterangan?: string;
  catatan?: string;
  admin?: string;
}

export interface DashboardStats {
  totalSiswa: number;
  totalHadir: number;
  totalHadirTepat: number;
  totalTerlambat: number;
  totalBolos: number;
  totalAlfa: number;
  totalSakit: number;
  totalIzin: number;
  totalIzinPulang: number;
  totalBelumAbsen: number;
  totalPulangTanpaDatang: number;
  persentaseHadir: string | number;
}

export interface RekapKelasData {
  [kelas: string]: {
    hadir: number;
    totalHadir: number;
    bolos: number;
    alfa: number;
    sakit: number;
    izin: number;
    izinPulang: number;
    belum: number;
    pulangTanpaDatang: number;
  };
}

export interface DailyTrendData {
  monthName: string;
  labels: number[];
  totalHadir: number[];
  hadirTepat: number[];
  terlambat: number[];
  sakit: number[];
  izin: number[];
  izinPulang: number[];
  alfa: number[];
}

export interface RekapSiswaItem {
  nisn: string;
  nama: string;
  kelas: string;
  terlambat: number;
  bolos: number;
  alfa: number;
  sakit: number;
  izin: number;
  izinPulang: number;
  pulangTanpaDatang: number;
  totalPelanggaran: number;
}

export interface DashboardData {
  todayDate: string;
  selectedDate: string;
  rekapMulaiDate: string;
  batasAlfa: string;
  batasPulang: string;
  isPastBatasAlfa: boolean;
  stats: DashboardStats;
  rekapKelas: RekapKelasData;
  listTerlambat: Array<{
    nisn: string;
    nama: string;
    kelas: string;
    jamDatang: string;
    status: string;
  }>;
  dailyTrend: DailyTrendData;
  listSiswa: StudentAbsenStatus[];
  rekapSiswa: RekapSiswaItem[];
}

export interface RecentScanLog {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  mode: 'DATANG' | 'PULANG' | 'IZIN_PULANG';
  isTerlambat: boolean;
  timeStr: string;
  statusText: string;
  failed?: boolean;
}

export interface WABatchItem {
  nis: string;
  nama: string;
  kelas: string;
  phone: string;
  jenis: string;
  status: string;
  jam: string;
  tanggal: string;
  url: string;
  statusProses: 'SUDAH DIPROSES' | 'BELUM DIPROSES';
  waktuProses?: string;
}

export interface WABatchResult {
  success: boolean;
  tanggal: string;
  filter: string[];
  total: number;
  sudahDiproses: number;
  belumDiproses: number;
  items: WABatchItem[];
  message: string;
}

export interface RiwayatSiswaReport {
  success: boolean;
  filename: string;
  nisn: string;
  nama: string;
  kelas: string;
  periodeMulai: string;
  dibuatTanggal: string;
  dibuatJam: string;
  jumlah: number;
  summary: {
    hadir: number;
    terlambat: number;
    bolos: number;
    alfa: number;
    sakit: number;
    izin: number;
    pulangTanpaDatang: number;
    izinPulang: number;
    total: number;
  };
  rows: Array<{
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
  }>;
}
