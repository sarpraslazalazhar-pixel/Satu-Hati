import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, FileText, Heart } from 'lucide-react';

export default function DonationReportPrintModal({
  isOpen,
  onClose,
  donations = [],
  currentAmount = 0,
  campaign = {}
}) {
  if (!isOpen) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const verifiedList = donations.filter((d) => d.status === 'verified');
  const qrisList = verifiedList.filter((d) => d.paymentMethod === 'qris');
  const cashList = verifiedList.filter((d) => d.paymentMethod === 'cash' && !d.isCommitment);
  const committedList = donations.filter((d) => d.isCommitment);
  const committedPaidList = committedList.filter((d) => d.status === 'verified');

  const qrisTotal = qrisList.reduce((acc, d) => acc + (d.amount || 0), 0);
  const cashTotal = cashList.reduce((acc, d) => acc + (d.amount || 0), 0);
  const committedTotal = committedList.reduce((acc, d) => acc + (d.amount || 0), 0);
  const committedPaidTotal = committedPaidList.reduce((acc, d) => acc + (d.amount || 0), 0);

  // Group QRIS donations by source PDF file for the audit log
  const pdfAuditMap = {};
  verifiedList.forEach((d) => {
    if (d.paymentMethod === 'qris') {
      const fileName = d.sourceFile || 'Mutasi QRIS (Statis / Manual)';
      if (!pdfAuditMap[fileName]) {
        pdfAuditMap[fileName] = {
          fileName,
          count: 0,
          totalAmount: 0,
        };
      }
      pdfAuditMap[fileName].count += 1;
      pdfAuditMap[fileName].totalAmount += d.amount || 0;
    }
  });
  const pdfAuditList = Object.values(pdfAuditMap);

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1C140E]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D88A3E]/40 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 w-full max-w-4xl max-h-[90vh] flex flex-col justify-between text-[#1C140E]">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDCD] mb-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C66723] text-white flex items-center justify-center font-bold shadow-2xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-poster font-black text-base sm:text-lg text-[#1C140E] leading-tight">
                Rekapitulasi Laporan Donasi (Ekspor PDF / Cetak)
              </h3>
              <p className="text-xs text-[#7A6855]">
                Laporan resmi penerimaan dan rekapitulasi donasi LAZ Al Azhar Peduli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#C66723] hover:bg-[#b0581a] text-white font-poster font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#D5BEA1] flex items-center justify-center hover:bg-amber-50 cursor-pointer text-[#7A6855]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-recap" className="flex-grow overflow-y-auto pr-1 text-[#1C140E] print:overflow-visible">
          
          {/* Formal Letterhead */}
          <div className="text-center pb-4 border-b border-[#D5BEA1] mb-5">
            <span className="text-xs font-poster font-bold tracking-widest text-[#C66723] uppercase block">
              LEMBAGA AMIL ZAKAT (LAZ) AL AZHAR PEDULI
            </span>
            <h2 className="font-poster font-black text-xl sm:text-2xl text-[#1C140E] mt-1 uppercase tracking-tight">
              LAPORAN REKAPITULASI RESMI PENERIMAAN DONASI
            </h2>
            <p className="text-xs font-semibold text-[#7A6855] mt-0.5">
              Program Kemanusiaan &amp; Pendidikan: Satu Hati untuk Palestina
            </p>
            <div className="mt-2 text-[11px] text-[#7A6855] font-mono">
              Dicetak pada: {todayFormatted} • Sistem Realtime LAZ Al Azhar Peduli
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="border border-[#E5DAC8] rounded-xl p-3 bg-white/90 shadow-2xs">
              <span className="text-[10px] font-bold text-[#7A6855] uppercase block">
                Total Terverifikasi
              </span>
              <span className="font-poster font-black text-lg text-[#C66723] block">
                {formatRupiah(currentAmount)}
              </span>
              <span className="text-[10px] text-[#7A6855] font-medium">
                {verifiedList.length} donatur aktif
              </span>
            </div>

            <div className="border border-[#E5DAC8] rounded-xl p-3 bg-white/90 shadow-2xs">
              <span className="text-[10px] font-bold text-[#7A6855] uppercase block">
                Penerimaan QRIS
              </span>
              <span className="font-poster font-black text-lg text-[#C66723] block">
                {formatRupiah(qrisTotal)}
              </span>
              <span className="text-[10px] text-[#7A6855] font-medium">
                {qrisList.length} transaksi QRIS
              </span>
            </div>

            <div className="border border-[#E5DAC8] rounded-xl p-3 bg-white/90 shadow-2xs">
              <span className="text-[10px] font-bold text-[#7A6855] uppercase block">
                Penerimaan Tunai
              </span>
              <span className="font-poster font-black text-lg text-[#C66723] block">
                {formatRupiah(cashTotal)}
              </span>
              <span className="text-[10px] text-[#7A6855] font-medium">
                {cashList.length} donasi tunai
              </span>
            </div>

            <div className="border border-[#E5DAC8] rounded-xl p-3 bg-white/90 shadow-2xs">
              <span className="text-[10px] font-bold text-[#7A6855] uppercase block">
                Komitmen / Book
              </span>
              <span className="font-poster font-black text-lg text-[#C66723] block">
                {formatRupiah(committedTotal)}
              </span>
              <span className="text-[10px] text-[#7A6855] font-medium block">
                {committedList.length} donatur janji
              </span>
              <span className="text-[10px] font-semibold block">
                <span className="text-emerald-700">{formatRupiah(committedPaidTotal)} sudah donasi ({committedPaidList.length})</span>
                <span className="text-[#D5BEA1]"> • </span>
                <span className="text-amber-700">{committedList.length - committedPaidList.length} belum</span>
              </span>
            </div>
          </div>

          {/* Log Audit Dokumen Mutasi PDF yang Diinput */}
          {pdfAuditList.length > 0 && (
            <div className="border border-[#E5DAC8] rounded-xl overflow-hidden mb-6 bg-white">
              <div className="bg-[#FAF6F0] px-3.5 py-2 border-b border-[#E8DDCD] flex items-center justify-between">
                <span className="font-poster font-bold text-xs uppercase tracking-wider text-[#1C140E] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#C66723]" />
                  <span>Log Audit Dokumen Mutasi PDF ({pdfAuditList.length} Dokumen Terinput)</span>
                </span>
                <span className="text-[11px] font-mono text-[#7A6855] font-semibold">
                  Total QRIS: {formatRupiah(qrisTotal)}
                </span>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#FAF6F0]/60 border-b border-[#E8DDCD] font-bold text-[#1C140E]">
                  <tr>
                    <th className="p-2 text-center w-10">No</th>
                    <th className="p-2">Nama Dokumen PDF yang Diinput</th>
                    <th className="p-2 text-center">Jumlah Transaksi</th>
                    <th className="p-2 text-right">Total Nominal</th>
                    <th className="p-2 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {pdfAuditList.map((doc, idx) => (
                    <tr key={`audit-doc-${idx}`} className="hover:bg-amber-50/40">
                      <td className="p-2 text-center font-mono text-[#7A6855]">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-[#1C140E] break-all">
                        {doc.fileName}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold text-stone-700">
                        {doc.count} transaksi
                      </td>
                      <td className="p-2 text-right font-poster font-black text-[#C66723]">
                        {formatRupiah(doc.totalAmount)}
                      </td>
                      <td className="p-2 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          Terverifikasi Sistem
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rincian Transaksi Table */}
          <div className="border border-[#E5DAC8] rounded-xl overflow-hidden mb-6 bg-white">
            <div className="bg-[#FAF6F0] px-3.5 py-2 border-b border-[#E8DDCD] flex items-center justify-between">
              <span className="font-poster font-bold text-xs uppercase tracking-wider text-[#1C140E]">
                Rincian Transaksi Donasi Terverifikasi ({verifiedList.length} Data)
              </span>
              <span className="text-[11px] font-mono text-[#7A6855] font-semibold">
                Target: {formatRupiah(campaign.targetAmount || 500000000)}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#FAF6F0]/60 border-b border-[#E8DDCD] font-bold text-[#1C140E]">
                <tr>
                  <th className="p-2 text-center w-10">No</th>
                  <th className="p-2">Waktu</th>
                  <th className="p-2">Nama Donatur</th>
                  <th className="p-2">Metode</th>
                  <th className="p-2">Dokumen Asal (Audit)</th>
                  <th className="p-2">No Referensi</th>
                  <th className="p-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {verifiedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Belum ada donasi terverifikasi.
                    </td>
                  </tr>
                ) : (
                  verifiedList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-amber-50/40">
                      <td className="p-2 text-center font-mono text-[#7A6855]">
                        {idx + 1}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-[#7A6855] whitespace-nowrap">
                        {item.donatedAt || item.createdAt || '-'}
                      </td>
                      <td className="p-2 font-poster font-bold text-[#1C140E]">
                        {item.donorName}
                        {item.isAnonymous && (
                          <span className="ml-1 text-[10px] font-normal text-[#7A6855] italic">
                            (Hamba Allah)
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="uppercase font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#E5DAC8] bg-[#FAF6F0] text-stone-700">
                          {item.paymentMethod || 'QRIS'}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-[10px] text-[#7A6855] max-w-[140px] truncate" title={item.sourceFile || 'Manual / Online'}>
                        {item.sourceFile || '-'}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-[#7A6855]">
                        {item.referenceNo || '-'}
                      </td>
                      <td className="p-2 text-right font-poster font-black text-[#C66723] whitespace-nowrap">
                        {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-[#FAF6F0] font-poster font-black border-t border-[#E8DDCD]">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right uppercase text-xs text-[#1C140E]">
                    Total Dana Donasi Terkumpul:
                  </td>
                  <td className="p-2.5 text-right font-poster font-black text-[#C66723] text-sm">
                    {formatRupiah(currentAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Formal Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-[#D5BEA1] text-center text-xs mt-6">
            <div>
              <p className="text-[#7A6855]">Mengetahui,</p>
              <p className="font-poster font-bold text-[#1C140E]">Pimpinan LAZ Al Azhar Peduli</p>
              <div className="h-16" />
              <p className="font-bold underline text-[#1C140E]">( ........................................ )</p>
              <p className="text-[10px] text-[#7A6855]">LAZ Al Azhar Peduli</p>
            </div>

            <div>
              <p className="text-[#7A6855]">Dibuat oleh,</p>
              <p className="font-poster font-bold text-[#1C140E]">Amil &amp; Bendahara</p>
              <div className="h-16" />
              <p className="font-bold underline text-[#1C140E]">( ........................................ )</p>
              <p className="text-[10px] text-[#7A6855]">LAZ Al Azhar Peduli</p>
            </div>
          </div>

        </div>

        {/* Footer info (Hidden in Print) */}
        <div className="pt-4 border-t border-[#E8DDCD] mt-4 flex items-center justify-between text-xs text-[#7A6855] print:hidden">
          <span>Tips: Di jendela print browser, pilih "Save as PDF" untuk mengunduh dokumen.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-amber-50/50 text-[#7A6855] font-bold rounded-xl border border-[#D5BEA1] cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
