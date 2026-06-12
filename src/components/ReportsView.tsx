/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaksi, AppConfig } from "../types";
import { formatRupiah, formatBulanIndo } from "../utils";
import { useState } from "react";
import { 
  Printer, 
  FileSpreadsheet, 
  FileText,
  Search, 
  Filter, 
  BookOpen, 
  TrendingUp,
  CreditCard,
  Coins,
  ArrowRightLeft
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportsViewProps {
  transaksiList: Transaksi[];
  config: AppConfig;
}

export default function ReportsView({ transaksiList, config }: ReportsViewProps) {
  
  // Date configuration
  const now = new Date();
  const currentMonthValue = String(now.getMonth() + 1).padStart(2, "0");
  const yearValue = String(now.getFullYear());
  
  // Filters states
  const [selectedMonth, setSelectedMonth] = useState(`${yearValue}-${currentMonthValue}`);
  const [selectedType, setSelectedType] = useState<string>("Semua");
  const [selectedMethod, setSelectedMethod] = useState<string>("Semua");

  const months = [
    { key: "Semua", label: "Semua Laporan" },
    { key: "2026-01", label: "Januari 2026" },
    { key: "2026-02", label: "Februari 2026" },
    { key: "2026-03", label: "Maret 2026" },
    { key: "2026-04", label: "April 2026" },
    { key: "2026-05", label: "Mei 2026" },
    { key: "2026-06", label: "Juni 2026" },
    { key: "2026-07", label: "Juli 2026" },
    { key: "2026-08", label: "Agustus 2026" },
    { key: "2026-09", label: "September 2026" },
    { key: "2026-10", label: "Oktober 2026" },
    { key: "2026-11", label: "November 2026" },
    { key: "2026-12", label: "Desember 2026" }
  ];

  const types = ["Semua", "SPP", "Uang Gedung", "Seragam", "Kegiatan", "Lainnya"];
  const methods = ["Semua", "Cash", "Transfer"];

  // Filtered transactions
  const filteredTrx = transaksiList.filter(t => {
    const matchesMonth = selectedMonth === "Semua" || t.tanggal.startsWith(selectedMonth);
    const matchesType = selectedType === "Semua" || t.jenisPembayaran === selectedType;
    const matchesMethod = selectedMethod === "Semua" || t.metode === selectedMethod;
    return matchesMonth && matchesType && matchesMethod;
  });

  // Category summary for filtered items
  const summaryCategory = {
    "SPP": 0,
    "Uang Gedung": 0,
    "Seragam": 0,
    "Kegiatan": 0,
    "Lainnya": 0
  };

  let totalCash = 0;
  let totalTransfer = 0;
  
  filteredTrx.forEach(t => {
    if (summaryCategory[t.jenisPembayaran] !== undefined) {
      summaryCategory[t.jenisPembayaran] += t.jumlah;
    } else {
      summaryCategory["Lainnya"] += t.jumlah;
    }

    if (t.metode === "Cash") {
      totalCash += t.jumlah;
    } else {
      totalTransfer += t.jumlah;
    }
  });

  const totalSummaryAmount = filteredTrx.reduce((sum, t) => sum + t.jumlah, 0);

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredTrx.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = ["No. Jurnal (Kuitansi)", "Siswa NIS", "Nama Siswa", "Kelas", "Tanggal Transaksi", "Kategori Pembayaran", "SPP Bulan", "Nominal (Rp)", "Metode Bayar", "Admin Penerima"];
    
    const rows = filteredTrx.map(t => [
      t.id,
      t.siswaNis,
      t.siswaNama,
      t.siswaKelas,
      t.tanggal,
      t.jenisPembayaran,
      t.bulanCovered || "-",
      t.jumlah,
      t.metode,
      t.penerima
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pembayaran_${selectedMonth}_${selectedType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF Function using jsPDF & jspdf-autotable
  const exportToPDF = () => {
    if (filteredTrx.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Color palette - elegant corporate navy theme
    const primaryColor = [26, 54, 93]; 
    const secondaryColor = [74, 85, 104]; 
    const blackColor = [17, 24, 39]; 

    // --- PAGE 1 HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("LAPORAN BULANAN PENERIMAAN KAS", 105, 15, { align: "center" });

    // School Name
    doc.setFontSize(12);
    doc.text(config.namaSekolah, 105, 21, { align: "center" });

    // Address & Phone
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`${config.alamatSekolah} | Telp: ${config.teleponSekolah || "-"}`, 105, 26, { align: "center" });

    // Double lines separator
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.8);
    doc.line(15, 29, 195, 29);
    doc.setLineWidth(0.2);
    doc.line(15, 30, 195, 30);

    // Meta parameters left section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text(`Periode Laporan:`, 15, 36);
    doc.setFont("helvetica", "normal");
    doc.text(activeMonthLabel, 48, 36);

    doc.setFont("helvetica", "bold");
    doc.text(`Kategori:`, 15, 41);
    doc.setFont("helvetica", "normal");
    doc.text(selectedType === "Semua" ? "Semua Pembayaran" : selectedType, 48, 41);

    // Meta parameters right section
    const formatTglIndo = (d: Date) => {
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    };
    
    doc.setFont("helvetica", "bold");
    doc.text(`Tanggal Cetak:`, 120, 36);
    doc.setFont("helvetica", "normal");
    doc.text(formatTglIndo(new Date()), 148, 36);

    doc.setFont("helvetica", "bold");
    doc.text(`Metode:`, 120, 41);
    doc.setFont("helvetica", "normal");
    doc.text(selectedMethod === "Semua" ? "Semua Metode" : selectedMethod, 148, 41);

    // --- REKAP BAR PANEL BLOCK ---
    doc.setFillColor(243, 244, 246); 
    doc.roundedRect(15, 46, 180, 18, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("TOTAL TERSELEKSI", 20, 51);
    doc.text("PENERIMAAN TUNAI", 80, 51);
    doc.text("PENERIMAAN BANK (TRANSFER)", 135, 51);

    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatRupiah(totalSummaryAmount), 20, 59);
    doc.setTextColor(21, 128, 61); 
    doc.text(formatRupiah(totalCash), 80, 59);
    doc.setTextColor(29, 78, 216); 
    doc.text(formatRupiah(totalTransfer), 135, 59);

    // --- DATA TABLE ---
    const headers = [
      ["No. Jurnal", "Nama Siswa / NIS", "Kelas", "Kategori", "Nominal", "Metode", "Tanggal", "Penerima"]
    ];

    const body = filteredTrx.map((t) => [
      t.id,
      `${t.siswaNama}\nNIS: ${t.siswaNis}`,
      `Kelas ${t.siswaKelas}`,
      t.bulanCovered ? `${t.jenisPembayaran}\n(${formatBulanIndo(t.bulanCovered).split(" ")[0]})` : t.jenisPembayaran,
      formatRupiah(t.jumlah).replace(",00", ""),
      t.metode,
      t.tanggal.split(" ")[0],
      t.penerima.split(" ")[0]
    ]);

    autoTable(doc, {
      startY: 69,
      head: headers,
      body: body,
      theme: "grid",
      headStyles: {
        fillColor: [26, 54, 93],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: "left",
        fontStyle: "bold"
      },
      columnStyles: {
        0: { cellWidth: 18, fontSize: 8 },
        1: { cellWidth: 42, fontSize: 8 },
        2: { cellWidth: 15, fontSize: 8, halign: "center" },
        3: { cellWidth: 32, fontSize: 8 },
        4: { cellWidth: 28, fontSize: 8, halign: "right", fontStyle: "bold" },
        5: { cellWidth: 15, fontSize: 8, halign: "center" },
        6: { cellWidth: 18, fontSize: 8, halign: "center" },
        7: { cellWidth: 12, fontSize: 8 }
      },
      styles: {
        textColor: [51, 51, 51],
        cellPadding: 2,
        valign: "middle"
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 75;

    // Signature flow logic
    let sigY = finalY + 12;
    if (sigY + 30 > doc.internal.pageSize.height) {
      doc.addPage();
      sigY = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);

    doc.text("Mengetahui,", 15, sigY);
    doc.setFont("helvetica", "bold");
    doc.text("Kepala Sekolah", 15, sigY + 4);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Bandung, ${new Date().toISOString().split("T")[0]}`, 140, sigY);
    doc.setFont("helvetica", "bold");
    doc.text("Kasir / Bendahara Sekolah", 140, sigY + 4);

    doc.line(15, sigY + 24, 70, sigY + 24);
    doc.line(140, sigY + 24, 190, sigY + 24);

    doc.setFont("helvetica", "bold");
    doc.text("( Drs. H. Mulyadi )", 15, sigY + 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("NIP. 196805121993021003", 15, sigY + 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`( ${config.penerimaDefault || "Alya Safitri"} )`, 140, sigY + 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Administrasi Keuangan", 140, sigY + 32);

    doc.save(`Laporan_Penerimaan_${selectedMonth}.pdf`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const activeMonthLabel = months.find(m => m.key === selectedMonth)?.label || selectedMonth;

  return (
    <div className="space-y-6 animate-fade-in text-sm text-slate-100">
      
      {/* Filters Form Panel */}
      <div className="glass glass-card p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-4.5 text-blue-400 animate-pulse" />
          <h3 className="font-bold text-white text-base">Filter Jurnal Pembayaran</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-slate-300">Rentang Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900"
            >
              {months.map((m) => (
                <option key={m.key} value={m.key} className="bg-slate-900 border-none select-none text-white">{m.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-slate-300">Jenis Pembayaran</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900"
            >
              {types.map((t, i) => (
                <option key={i} value={t} className="bg-slate-900 border-none select-none text-white">{t === "Semua" ? "Semua Kategori" : t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-slate-300">Metode Verifikasi</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900"
            >
              {methods.map((m, i) => (
                <option key={i} value={m} className="bg-slate-900 border-none select-none text-white">{m === "Semua" ? "Semua Metode" : m}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Aggregate Summaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Summary */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Total Rekap Terpilih</span>
            <span className="size-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-bold font-sans text-white">{formatRupiah(totalSummaryAmount)}</h4>
            <p className="text-xs text-slate-300 font-medium">{filteredTrx.length} Transaksi Terhitung</p>
          </div>
        </div>

        {/* Cash Breakdown */}
        <div className="glass glass-card p-5 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Penerimaan Kasir Tunai</span>
            <Coins className="size-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-bold font-mono text-emerald-400">{formatRupiah(totalCash)}</h4>
            <p className="text-xs text-slate-300">Total Validasi Pembayaran Cash</p>
          </div>
        </div>

        {/* Transfer Breakdown */}
        <div className="glass glass-card p-5 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Penerimaan Rekening Bank</span>
            <CreditCard className="size-4 text-blue-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-bold font-mono text-blue-400">{formatRupiah(totalTransfer)}</h4>
            <p className="text-xs text-slate-300">Validasi Transfer Bank</p>
          </div>
        </div>

      </div>

      {/* Main Journal Data Table */}
      <div className="glass glass-card rounded-2xl overflow-hidden flex flex-col">
        
        {/* Table Controls */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-sm">Rincian Buku Jurnal Penerimaan</h3>
            <p className="text-xs text-slate-350 mt-0.5">Laporan bulanan penarikan kas untuk periode berjalan</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              title="Ekspor laporan ke format Excel (CSV)"
            >
              <FileSpreadsheet className="size-4 text-emerald-400 animate-bounce" />
              Ekspor Excel/CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <FileText className="size-4 text-red-400 animate-pulse" />
              Ekspor ke PDF
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 border border-blue-400/20 transition-colors cursor-pointer"
            >
              <Printer className="size-4" />
              Cetak Jurnal Laporan
            </button>
          </div>
        </div>

        {/* Allocation stats for current filters */}
        <div className="bg-white/5 border-b border-white/10 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {Object.entries(summaryCategory).map(([cat, total]) => (
            <div key={cat} className="p-2 border border-white/5 bg-white/5 rounded-xl">
              <span className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider mb-0.5">{cat}</span>
              <span className="block text-xs font-bold font-mono text-white">{formatRupiah(total).split(",")[0]}</span>
            </div>
          ))}
        </div>

        {/* Table itself */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase bg-white/5">
                <th className="py-2.5 px-4 font-bold">No. Jurnal</th>
                <th className="py-2.5 px-4 font-bold">Nama Siswa / NIS</th>
                <th className="py-2.5 px-4 font-bold">Kelas</th>
                <th className="py-2.5 px-4 font-bold">Kategori Pembayaran</th>
                <th className="py-2.5 px-4 text-right font-bold">Nominal</th>
                <th className="py-2.5 px-4 text-center font-bold">Metode</th>
                <th className="py-2.5 px-4 font-bold">Tanggal Jurnal</th>
                <th className="py-2.5 px-4 font-bold">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredTrx.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[10px] text-slate-400">{t.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block leading-tight">{t.siswaNama}</span>
                    <span className="text-[10px] font-mono text-slate-400">NIS: {t.siswaNis}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                      Kelas {t.siswaKelas}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-100 text-xs">{t.jenisPembayaran}</span>
                    {t.bulanCovered && (
                      <span className="block text-[10px] tracking-tight text-slate-400">SPP Bulan {formatBulanIndo(t.bulanCovered).split(" ")[0]}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{formatRupiah(t.jumlah)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      t.metode === "Cash" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {t.metode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">{t.tanggal}</td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-350">{t.penerima.split(" ")[0]}</td>
                </tr>
              ))}

              {filteredTrx.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-405 text-xs italic">
                    Belum ada catatan transaksi pada filter terpilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white/5 px-5 py-3 border-t border-white/10 text-xs text-slate-300">
          <span>Menemukan <b>{filteredTrx.length}</b> rekaman jurnal dari total <b>{transaksiList.length}</b> di server.</span>
        </div>

      </div>

      {/* --- DUPLICATE PRINTABLE REPORT PANEL --- */}
      {/* This element will be targeted by @media print in index.css */}
      <div className="printable-report bg-white text-black leading-relaxed" style={{ fontFamily: "sans-serif" }}>
        
        {/* Header Laporan */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: "3px double #333", paddingBottom: "15px", marginBottom: "20px", gap: "20px" }}>
          {config.logoSekolah && (
            <img 
              src={config.logoSekolah} 
              alt="Logo Sekolah" 
              style={{ width: "70px", height: "70px", objectFit: "contain" }} 
            />
          )}
          <div style={{ flex: 1, textAlign: config.logoSekolah ? "left" : "center" }}>
            <h2 style={{ margin: 0, textTransform: "uppercase", fontSize: "18px", fontWeight: "bold" }}>LAPORAN BULANAN PENERIMAAN KAS</h2>
            <h3 style={{ margin: "5px 0 0 0", fontSize: "15px", textTransform: "uppercase", fontWeight: "bold" }}>{config.namaSekolah}</h3>
            <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#555" }}>{config.alamatSekolah} • Telp: {config.teleponSekolah}</p>
            <p style={{ margin: "5px 0 0 0", fontSize: "11px", fontWeight: "bold", color: "#333" }}>
              Laporan Periode: {activeMonthLabel} | Filter Kategori: {selectedType === "Semua" ? "Semua Pembayaran" : selectedType}
            </p>
          </div>
        </div>

        {/* Ringkasan Akal */}
        <div style={{ display: "flex", gap: "15px", margin: "20px 0" }}>
          <div style={{ flex: 1, border: "1px solid #ddd", padding: "10px", borderRadius: "6px" }}>
            <span style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: "bold" }}>Total Penerimaan</span>
            <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold" }}>{formatRupiah(totalSummaryAmount)}</h4>
          </div>
          <div style={{ flex: 1, border: "1px solid #ddd", padding: "10px", borderRadius: "6px" }}>
            <span style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: "bold" }}>Masukan Tunai</span>
            <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold" }}>{formatRupiah(totalCash)}</h4>
          </div>
          <div style={{ flex: 1, border: "1px solid #ddd", padding: "10px", borderRadius: "6px" }}>
            <span style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: "bold" }}>Transfer Bank</span>
            <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold" }}>{formatRupiah(totalTransfer)}</h4>
          </div>
        </div>

        {/* Sub Allocation */}
        <h4 style={{ fontSize: "13px", margin: "20px 0 8px 0" }}>RINCIAN ALOKASI BIAYA:</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
              {Object.keys(summaryCategory).map(cat => (
                <th key={cat} style={{ padding: "8px", border: "1px solid #ddd" }}>{cat}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {Object.values(summaryCategory).map((val, i) => (
                <td key={i} style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold", textAlign: "right" }}>
                  {formatRupiah(val)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Daftar Jurnal Jelas */}
        <h4 style={{ fontSize: "13px", margin: "15px 0 8px 0" }}>RINCIAN TRANSAKSI:</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #333", borderTop: "1px solid #333" }}>
              <th style={{ padding: "6px", textAlign: "left" }}>No. Kuitansi</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Siswa / NIS</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Kelas</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Pembayaran</th>
              <th style={{ padding: "6px", textAlign: "right" }}>Nominal (Rp)</th>
              <th style={{ padding: "6px", textAlign: "center" }}>Metode</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Tanggal</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Penerima</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrx.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "6px", fontFamily: "monospace" }}>{t.id}</td>
                <td style={{ padding: "6px" }}>{t.siswaNama} <br/><span style={{ fontSize: "9px", color: "#666" }}>{t.siswaNis}</span></td>
                <td style={{ padding: "6px" }}>{t.siswaKelas}</td>
                <td style={{ padding: "6px" }}>{t.jenisPembayaran} {t.bulanCovered ? `(${formatBulanIndo(t.bulanCovered).split(" ")[0]})` : ""}</td>
                <td style={{ padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatRupiah(t.jumlah).replace("Rp", "")}</td>
                <td style={{ padding: "6px", textAlign: "center" }}>{t.metode}</td>
                <td style={{ padding: "6px" }}>{t.tanggal.split(" ")[0]}</td>
                <td style={{ padding: "6px" }}>{t.penerima.split(" ")[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures for Report approval */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", fontSize: "12px" }}>
          <div>
            <p>Mengetahui,</p>
            <p style={{ marginTop: "5px", fontWeight: "bold" }}>Kepala Sekolah</p>
            <div style={{ height: "60px" }}></div>
            <p style={{ fontWeight: "bold", textDecoration: "underline" }}>( Drs. H. Mulyadi )</p>
            <p>NIP. 196805121993021003</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p>Bandung, {new Date().toISOString().split("T")[0]}</p>
            <p style={{ marginTop: "5px", fontWeight: "bold" }}>Kasir / Bendahara Sekolah</p>
            <div style={{ height: "60px" }}></div>
            <p style={{ fontWeight: "bold", textDecoration: "underline" }}>( {config.penerimaDefault || "Alya Safitri"} )</p>
            <p>Administrasi Keuangan</p>
          </div>
        </div>

      </div>

    </div>
  );
}
