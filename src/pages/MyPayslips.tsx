import { useEffect, useState } from 'react';
import { ownPayslipService } from '../services/api';
import type { OwnPayslip } from '../services/api';

const money = (amount: number | undefined, currency: string) =>
  `${(amount || 0).toLocaleString()} ${currency || 'MMK'}`;

export default function MyPayslips() {
  const [items, setItems] = useState<OwnPayslip[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    ownPayslipService.list(page).then(result => {
      if (active) { setItems(result.payslips); setMore(result.hasMore); }
    }).catch(() => { if (active) { setItems([]); setError(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  return <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">ကျွန်ုပ်၏ လစာစာရွက်များ</h1>
      <p className="mt-1 text-sm text-slate-600">ပေးချေပြီးသော မိမိလစာစာရွက်များကို ကြည့်ရှုနိုင်ပါသည်။</p>
    </div>
    {loading && <p>ဖွင့်နေပါသည်…</p>}
    {error && <p role="alert" className="text-red-700">လစာစာရွက်များကို ဖွင့်မရပါ။ ခဏအကြာ ပြန်စမ်းပါ။</p>}
    {!loading && !error && items.length === 0 && <p className="rounded-xl bg-white p-5">ပေးချေပြီးသော လစာစာရွက် မရှိသေးပါ။</p>}
    {!loading && !error && items.map(item => <article key={item._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold">{item.month} / {item.year}</h2><p className="text-sm text-slate-500">{item.employeeName}</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">ပေးချေပြီး</span>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">အခြေခံလစာ</dt><dd className="font-medium">{money(item.baseSalary, item.currency)}</dd></div>
        <div><dt className="text-slate-500">ထောက်ပံ့ကြေး စုစုပေါင်း</dt><dd className="font-medium">{money(item.totalAllowances, item.currency)}</dd></div>
        <div><dt className="text-slate-500">ဖြတ်တောက်ငွေ စုစုပေါင်း</dt><dd className="font-medium">{money(item.totalDeductions, item.currency)}</dd></div>
        <div><dt className="text-slate-500">ပြန်လည်ပေးချေသည့် expense</dt><dd className="font-medium">{money(item.reimbursedExpensesTotal, item.currency)}</dd></div>
        <div><dt className="text-slate-500">လက်ခံရရှိငွေ</dt><dd className="text-lg font-bold">{money(item.netPay, item.currency)}</dd></div>
        <div><dt className="text-slate-500">ပေးချေသည့်နည်းလမ်း</dt><dd>{item.paymentChannel || '—'}</dd></div>
      </dl>
    </article>)}
    {!loading && !error && <div className="flex items-center gap-3">
      <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(value => value - 1)}>ရှေ့စာမျက်နှာ</button>
      <span>{page}</span>
      <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={!more} onClick={() => setPage(value => value + 1)}>နောက်စာမျက်နှာ</button>
    </div>}
  </div>;
}
