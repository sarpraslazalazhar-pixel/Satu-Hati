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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-[3px] border-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 w-full max-w-4xl max-h-[90vh] flex flex-col justify-between">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 border-2 border-slate-900 flex items-center justify-center text-red-600 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Rekapitulasi Laporan Donasi (Ekspor PDF / Cetak)
              </h3>
              <p className="text-xs text-slate-600">
                Laporan resmi penerimaan dan rekapitulasi donasi LAZ Al Azhar Peduli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border-2 border-slate-900 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border-2 border-slate-900 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-recap" className="flex-grow overflow-y-auto pr-1 text-slate-900 print:overflow-visible">
          
          {/* Formal Letterhead */}
          <div className="text-center pb-4 border-b-2 border-slate-800 mb-5">
            <span className="text-xs font-black tracking-widest text-emerald-800 uppercase block">
              LEMBAGA AMIL ZAKAT (LAZ) AL AZHAR PEDULI
            </span>
            <h2 className="font-black text-xl sm:text-2xl text-slate-950 mt-1 uppercase tracking-tight">
              LAPORAN REKAPITULASI RESMI PENERIMAAN DONASI
            </h2>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              Program Kemanusiaan &amp; Pendidikan: Satu Hati untuk Palestina
            </p>
            <div className="mt-2 text-[11px] text-slate-500 font-mono">
              Dicetak pada: {todayFormatted} • Sistem Realtime LAZ Al Azhar Peduli
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="border-2 border-slate-800 rounded-xl p-3 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Total Terverifikasi
              </span>
              <span className="font-mono text-lg font-black text-emerald-700 block">
                {formatRupiah(currentAmount)}
              </span>
              <span className="text-[10px] text-slate-600 font-medium">
                {verifiedList.length} donatur aktif
              </span>
            </div>

            <div className="border-2 border-slate-800 rounded-xl p-3 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Penerimaan QRIS
              </span>
              <span className="font-mono text-lg font-black text-emerald-700 block">
                {formatRupiah(qrisTotal)}
              </span>
              <span className="text-[10px] text-slate-600 font-medium">
                {qrisList.length} transaksi QRIS
              </span>
            </div>

            <div className="border-2 border-slate-800 rounded-xl p-3 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Penerimaan Tunai
              </span>
              <span className="font-mono text-lg font-black text-emerald-700 block">
                {formatRupiah(cashTotal)}
              </span>
              <span className="text-[10px] text-slate-600 font-medium">
                {cashList.length} donasi tunai
              </span>
            </div>

            <div className="border-2 border-slate-800 rounded-xl p-3 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Komitmen / Book
              </span>
              <span className="font-mono text-lg font-black text-amber-700 block">
                {formatRupiah(committedTotal)}
              </span>
              <span className="text-[10px] text-slate-600 font-medium block">
                {committedList.length} donatur janji
              </span>
              <span className="text-[10px] font-semibold block">
                <span className="text-emerald-700">{formatRupiah(committedPaidTotal)} sudah donasi ({committedPaidList.length})</span>
                <span className="text-slate-400"> • </span>
                <span className="text-amber-700">{committedList.length - committedPaidList.length} belum</span>
              </span>
            </div>
          </div>

          {/* Log Audit Dokumen Mutasi PDF yang Diinput */}
          {pdfAuditList.length > 0 && (
            <div className="border-2 border-slate-800 rounded-xl overflow-hidden mb-6">
              <div className="bg-amber-50 px-3.5 py-2 border-b-2 border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-800" />
                  <span>Log Audit Dokumen Mutasi PDF ({pdfAuditList.length} Dokumen Terinput)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600 font-semibold">
                  Total QRIS: {formatRupiah(qrisTotal)}
                </span>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 text-center w-10">No</th>
                    <th className="p-2">Nama Dokumen PDF yang Diinput</th>
                    <th className="p-2 text-center">Jumlah Transaksi</th>
                    <th className="p-2 text-right">Total Nominal</th>
                    <th className="p-2 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pdfAuditList.map((doc, idx) => (
                    <tr key={`audit-doc-${idx}`} className="hover:bg-slate-50">
                      <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-slate-900 break-all">
                        {doc.fileName}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold">
                        {doc.count} transaksi
                      </td>
                      <td className="p-2 text-right font-mono font-black text-emerald-800">
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
          <div className="border-2 border-slate-800 rounded-xl overflow-hidden mb-6">
            <div className="bg-slate-100 px-3.5 py-2 border-b-2 border-slate-800 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Rincian Transaksi Donasi Terverifikasi ({verifiedList.length} Data)
              </span>
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                Target: {formatRupiah(campaign.targetAmount || 500000000)}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-300 font-bold text-slate-700">
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
              <tbody className="divide-y divide-slate-200">
                {verifiedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Belum ada donasi terverifikasi.
                    </td>
                  </tr>
                ) : (
                  verifiedList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {item.donatedAt || item.createdAt || '-'}
                      </td>
                      <td className="p-2 font-bold text-slate-900">
                        {item.donorName}
                        {item.isAnonymous && (
                          <span className="ml-1 text-[10px] font-normal text-slate-500 italic">
                            (Hamba Allah)
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="uppercase font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100">
                          {item.paymentMethod || 'QRIS'}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-[10px] text-slate-600 max-w-[140px] truncate" title={item.sourceFile || 'Manual / Online'}>
                        {item.sourceFile || '-'}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-500">
                        {item.referenceNo || '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-800">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right uppercase text-xs">
                    Total Dana Donasi Terkumpul:
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">
                    {formatRupiah(currentAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Formal Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center text-xs mt-6">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Pimpinan LAZ Al Azhar Peduli</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">( ........................................ )</p>
              <p className="text-[10px] text-slate-500">LAZ Al Azhar Peduli</p>
            </div>

            <div>
              <p className="text-slate-600">Dibuat oleh,</p>
              <p className="font-bold text-slate-900">Amil &amp; Bendahara</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">( ........................................ )</p>
              <p className="text-[10px] text-slate-500">LAZ Al Azhar Peduli</p>
            </div>
          </div>

        </div>

        {/* Footer info (Hidden in Print) */}
        <div className="pt-4 border-t-2 border-slate-200 mt-4 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Tips: Di jendela print browser, pilih "Save as PDF" untuk mengunduh dokumen.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
