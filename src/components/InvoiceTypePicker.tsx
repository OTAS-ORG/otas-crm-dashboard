import React from "react";
import { Wrench, Server } from "lucide-react";
import type { InvoiceType } from "../types";

interface InvoiceTypePickerProps {
  onSelect: (type: InvoiceType) => void;
}

const InvoiceTypePicker: React.FC<InvoiceTypePickerProps> = ({ onSelect }) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Choose Invoice Type
        </h2>
        <p className="text-sm text-slate-500">
          Select the type of invoice you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={() => onSelect("customize_project")}
          className="group text-left p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Wrench size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Customize Project
            </h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            For custom development projects with itemized descriptions, payment
            terms, and amounts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Description", "Payment Term", "Amount (MMK)"].map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg"
              >
                {f}
              </span>
            ))}
          </div>
        </button>

        <button
          onClick={() => onSelect("service_fee")}
          className="group text-left p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Server size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Server / Domain / Maintenance
            </h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            For server hosting, domain registration, and maintenance service
            fees with billing periods.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Description", "Start Date", "End Date", "Total (MMK)"].map(
              (f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg"
                >
                  {f}
                </span>
              ),
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default InvoiceTypePicker;
