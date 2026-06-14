import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoiceService } from "../services/api";
import { clientService } from "../services/api";
import type { Invoice, Client, InvoiceItem } from "../types";
import { downloadAsImage, downloadAsPDF } from "../utils/export";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  CreditCard,
  Banknote,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<
    "invoice" | "customer" | "caregiver"
  >("invoice");
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"customer" | "caregiver">(
    "customer",
  );
  const [paymentMethod, setPaymentMethod] = useState("KBZPay (Kpay)");
  const [additionalNote, setAdditionalNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Edit form data
  const [editData, setEditData] = useState<any>({
    clientId: "",
    companyName: "",
    contactPerson: "",
    contactInfo: "",
    projectId: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    amount: 0,
    platformFeeRate: 0,
    additionalCharges: [] as { name: string; amount: number }[],
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    serviceStartDate: "",
    serviceEndDate: "",
    paymentMethod: "KBZPay (Kpay)",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const clientData = await clientService.getClients();
        setClients(clientData);

        if (!isNew && id) {
          const invData = await invoiceService.getInvoice(id);
          setInvoice(invData);
          setEditData({
            clientId: invData.clientId || "",
            companyName: invData.companyName || "",
            contactPerson: invData.contactPerson || "",
            contactInfo: invData.contactInfo || "",
            projectId: invData.projectId || "",
            items: invData.items?.length
              ? invData.items
              : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
            amount: invData.amount || 0,
            platformFeeRate: invData.platformFeeRate || 0,
            additionalCharges: invData.additionalCharges || [],
            date: invData.date
              ? invData.date.split("T")[0]
              : new Date().toISOString().split("T")[0],
            dueDate: invData.dueDate ? invData.dueDate.split("T")[0] : "",
            serviceStartDate: invData.serviceStartDate
              ? invData.serviceStartDate.split("T")[0]
              : "",
            serviceEndDate: invData.serviceEndDate
              ? invData.serviceEndDate.split("T")[0]
              : "",
            paymentMethod: invData.paymentMethod || "KBZPay (Kpay)",
          });
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c._id === clientId);
    if (client) {
      setEditData({
        ...editData,
        clientId: client._id,
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        contactInfo: client.contactInfo,
        projectId: client.projectId || "",
      });
    }
  };

  const recalcItem = (items: InvoiceItem[]) => {
    return items.map((item) => ({
      ...item,
      amount: (item.quantity || 0) * (item.unitPrice || 0),
    }));
  };

  const recalcAmount = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const newItems = [...editData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const recalculated = recalcItem(newItems);
    const totalAmount = recalcAmount(recalculated);
    setEditData({
      ...editData,
      items: recalculated,
      amount: totalAmount,
    });
  };

  const addItem = () => {
    setEditData({
      ...editData,
      items: [
        ...editData.items,
        { description: "", quantity: 1, unitPrice: 0, amount: 0 },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (editData.items.length <= 1) return;
    const newItems = editData.items.filter((_: any, i: number) => i !== index);
    const totalAmount = recalcAmount(recalcItem(newItems));
    setEditData({
      ...editData,
      items: newItems,
      amount: totalAmount,
    });
  };

  const addCharge = () => {
    setEditData({
      ...editData,
      additionalCharges: [
        ...editData.additionalCharges,
        { name: "", amount: 0 },
      ],
    });
  };

  const removeCharge = (index: number) => {
    setEditData({
      ...editData,
      additionalCharges: editData.additionalCharges.filter(
        (_: any, i: number) => i !== index,
      ),
    });
  };

  const handleChargeChange = (index: number, field: string, value: any) => {
    const newCharges = [...editData.additionalCharges];
    newCharges[index] = {
      ...newCharges[index],
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    };
    setEditData({ ...editData, additionalCharges: newCharges });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const feeRate = editData.platformFeeRate || 0;
      const platformFee = Math.round((editData.amount || 0) * (feeRate / 100));
      const payload = {
        ...editData,
        platformFee,
        platformFeeRate: feeRate,
        items: editData.items?.filter((i: InvoiceItem) => i.description.trim()),
        date: editData.date ? new Date(editData.date).toISOString() : undefined,
        dueDate: editData.dueDate
          ? new Date(editData.dueDate).toISOString()
          : undefined,
        serviceStartDate: editData.serviceStartDate
          ? new Date(editData.serviceStartDate).toISOString()
          : undefined,
        serviceEndDate: editData.serviceEndDate
          ? new Date(editData.serviceEndDate).toISOString()
          : undefined,
      };

      if (isNew) {
        const created = await invoiceService.createInvoice(payload);
        setInvoice(created);
        navigate(`/invoices/${created._id}`, { replace: true });
      } else if (id) {
        const updated = await invoiceService.updateInvoice(id, payload);
        setInvoice(updated);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving invoice:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (isNew) {
      navigate("/invoices");
      return;
    }
    if (invoice) {
      setEditData({
        clientId: invoice.clientId || "",
        companyName: invoice.companyName || "",
        contactPerson: invoice.contactPerson || "",
        contactInfo: invoice.contactInfo || "",
        projectId: invoice.projectId || "",
        items: invoice.items?.length
          ? invoice.items
          : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
        amount: invoice.amount || 0,
        platformFeeRate: invoice.platformFeeRate || 0,
        additionalCharges: invoice.additionalCharges || [],
        date: invoice.date ? invoice.date.split("T")[0] : "",
        dueDate: invoice.dueDate ? invoice.dueDate.split("T")[0] : "",
        serviceStartDate: invoice.serviceStartDate
          ? invoice.serviceStartDate.split("T")[0]
          : "",
        serviceEndDate: invoice.serviceEndDate
          ? invoice.serviceEndDate.split("T")[0]
          : "",
        paymentMethod: invoice.paymentMethod || "KBZPay (Kpay)",
      });
    }
    setIsEditing(false);
  };

  const toggleCustomerStatus = () => {
    if (!invoice) return;
    if (invoice.paymentStatus === "Received") {
      invoiceService
        .updateInvoiceStatus(invoice._id, { paymentStatus: "Pending" })
        .then(setInvoice);
    } else {
      setModalType("customer");
      setIsModalOpen(true);
    }
  };

  const toggleCaregiverStatus = () => {
    if (!invoice) return;
    if (invoice.payoutStatus === "Paid") {
      invoiceService
        .updateInvoiceStatus(invoice._id, { payoutStatus: "Pending" })
        .then(setInvoice);
    } else {
      setModalType("caregiver");
      setIsModalOpen(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!invoice) return;
    try {
      const data = {
        channel: paymentMethod,
        amount: paymentAmount || invoice.amount + (invoice.platformFee || 0),
        senderName: senderName || invoice.companyName,
        dateTime: new Date(paymentDate).toISOString(),
        note: additionalNote,
      };
      const updated = await invoiceService.confirmPayment(invoice._id, data);
      setInvoice(updated);
      setIsModalOpen(false);
      setAdditionalNote("");
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  const handleConfirmPayout = async () => {
    if (!invoice) return;
    try {
      const data = {
        channel: paymentMethod,
        amount: paymentAmount || invoice.amount,
        receiverName: receiverName || invoice.companyName,
        dateTime: new Date(paymentDate).toISOString(),
        note: additionalNote,
      };
      const updated = await invoiceService.confirmPayout(invoice._id, data);
      setInvoice(updated);
      setIsModalOpen(false);
      setAdditionalNote("");
    } catch (error) {
      console.error("Error confirming payout:", error);
    }
  };

  const handleLock = async () => {
    if (!invoice) return;
    try {
      const updated = await invoiceService.lockInvoice(invoice._id);
      setInvoice(updated);
    } catch (error) {
      console.error("Error locking invoice:", error);
    }
  };

  const handleUnlock = async () => {
    if (!invoice) return;
    try {
      const updated = await invoiceService.unlockInvoice(invoice._id);
      setInvoice(updated);
    } catch (error) {
      console.error("Error unlocking invoice:", error);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-500 font-medium">
        Loading invoice details...
      </div>
    );

  const isReceipt = invoice?.paymentStatus === "Received";
  const isVoucher = invoice?.payoutStatus === "Paid";
  const isLocked = invoice?.isLocked || false;
  const canEdit = !isLocked && !isNew;

  const displayData = isNew ? editData : invoice || editData;
  const currentPlatformFeeRate = displayData.platformFeeRate || 0;
  const currentPlatformFee =
    displayData.platformFee ||
    Math.round((displayData.amount || 0) * (currentPlatformFeeRate / 100));
  const additionalTotal = (displayData.additionalCharges || []).reduce(
    (sum: number, c: any) => sum + (c.amount || 0),
    0,
  );
  const grandTotal =
    (displayData.amount || 0) + currentPlatformFee + additionalTotal;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const inputClasses =
    "block w-full border border-slate-200 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all bg-white";
  const labelClasses =
    "block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1";
  const valueClasses = "text-sm font-semibold text-slate-900";

  return (
    <div
      className={`mx-auto pb-20 transition-all duration-300 ${showPreview ? "max-w-[1500px]" : "max-w-3xl"}`}
    >
      {/* Top Nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate("/invoices")}
          className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors font-semibold"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Invoices
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight mr-2">
            Invoice
          </span>
          <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg">
            {isNew ? "NEW" : invoice?.invoiceNumber}
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {updateSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2 mb-5 animate-pulse">
          <CheckCircle size={16} />
          <span className="text-sm font-semibold">
            Invoice updated successfully!
          </span>
        </div>
      )}

      <div
        className={`grid gap-6 items-start transition-all duration-300 ${showPreview ? "grid-cols-1 xl:grid-cols-12" : "grid-cols-1"}`}
      >
        {/* Left Column: Controls + Data */}
        <div className={`space-y-5 ${showPreview ? "xl:col-span-4" : ""}`}>
          {/* Admin Controls Card */}
          {!isNew && invoice && (
            <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm">
              <div className="bg-indigo-50 px-5 py-2.5 border-b border-indigo-200 flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                    Admin Controls
                  </h3>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      Locked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <button
                      onClick={handleUnlock}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                    >
                      Unlock
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${isEditing ? "bg-red-500 text-white" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
                    >
                      {isEditing ? "Cancel Edit" : "Edit"}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${isReceipt ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        Customer Payment
                      </p>
                      <p className="text-xs font-bold text-slate-900">
                        {invoice.paymentStatus}
                      </p>
                    </div>
                  </div>
                  {(!isReceipt || isEditing) && (
                    <button
                      onClick={toggleCustomerStatus}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${isReceipt ? "bg-white border border-red-200 text-red-600 hover:bg-red-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                    >
                      {isReceipt ? "Mark Pending" : "Mark Received"}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${isVoucher ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      <Banknote size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        Payout
                      </p>
                      <p className="text-xs font-bold text-slate-900">
                        {invoice.payoutStatus}
                      </p>
                    </div>
                  </div>
                  {(!isVoucher || isEditing) && (
                    <button
                      onClick={toggleCaregiverStatus}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${isVoucher ? "bg-white border border-red-200 text-red-600 hover:bg-red-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                    >
                      {isVoucher ? "Mark Pending" : "Mark Paid"}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`w-full inline-flex items-center justify-center px-5 py-2.5 border border-transparent shadow-md text-sm font-bold rounded-xl transition-all duration-300 mt-1 ${showPreview ? "bg-slate-700 text-white hover:bg-slate-800" : "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white hover:from-indigo-700 hover:to-emerald-700 hover:shadow-lg"}`}
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" /> Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" /> Generate Preview
                    </>
                  )}
                </button>

                {isReceipt && isVoucher && !isLocked && (
                  <button
                    onClick={handleLock}
                    className="w-full inline-flex items-center justify-center px-5 py-2.5 border border-red-200 shadow-md text-sm font-bold rounded-xl transition-all duration-300 mt-2 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Lock Invoice (Payment Confirmed)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Invoice Data Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900">
                {isNew ? "New Invoice" : "Invoice Details"}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-all gap-1"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}
                {isLocked && !isNew && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 gap-1">
                    Locked
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Client Selection */}
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 mb-3">
                      Client
                    </h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className={labelClasses}>Select Client</label>
                        <select
                          className={inputClasses}
                          value={editData.clientId}
                          onChange={(e) => handleClientSelect(e.target.value)}
                        >
                          <option value="">-- Select Client --</option>
                          {clients.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.companyName} - {c.contactPerson}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Company Name</label>
                        <input
                          type="text"
                          className={inputClasses}
                          value={editData.companyName}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              companyName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClasses}>Contact Person</label>
                          <input
                            type="text"
                            className={inputClasses}
                            value={editData.contactPerson}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                contactPerson: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClasses}>Contact Info</label>
                          <input
                            type="text"
                            className={inputClasses}
                            value={editData.contactInfo}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                contactInfo: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>Project ID</label>
                        <input
                          type="text"
                          className={inputClasses}
                          value={editData.projectId || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              projectId: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Items */}
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-700">
                        Service Items
                      </h3>
                      <button
                        onClick={addItem}
                        className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 gap-1"
                      >
                        <Plus size={10} /> Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editData.items?.map((item: InvoiceItem, i: number) => (
                        <div
                          key={i}
                          className="flex gap-2 items-start p-2 bg-white rounded-lg border border-slate-100"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Description"
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs mb-1"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  i,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="0"
                                placeholder="Qty"
                                className="w-16 border border-slate-200 rounded px-2 py-1.5 text-xs"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    i,
                                    "quantity",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Price"
                                className="w-24 border border-slate-200 rounded px-2 py-1.5 text-xs"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    i,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                              <span className="text-xs font-bold text-slate-700 self-center whitespace-nowrap">
                                {(item.amount || 0).toLocaleString()} MMK
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(i)}
                            className="p-1 text-red-400 hover:text-red-600 mt-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 mb-3">
                      Financials
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClasses}>Platform Fee (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          className={inputClasses}
                          value={editData.platformFeeRate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              platformFeeRate: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Payment Method</label>
                        <select
                          className={inputClasses}
                          value={editData.paymentMethod}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              paymentMethod: e.target.value,
                            })
                          }
                        >
                          <option value="KBZPay (Kpay)">KBZPay (Kpay)</option>
                          <option value="WavePay">WavePay</option>
                          <option value="AYAPay">AYAPay</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className={labelClasses}>Invoice Date</label>
                        <input
                          type="date"
                          className={inputClasses}
                          value={editData.date}
                          onChange={(e) =>
                            setEditData({ ...editData, date: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Due Date</label>
                        <input
                          type="date"
                          className={inputClasses}
                          value={editData.dueDate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              dueDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className={labelClasses}>Service Start</label>
                        <input
                          type="date"
                          className={inputClasses}
                          value={editData.serviceStartDate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              serviceStartDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Service End</label>
                        <input
                          type="date"
                          className={inputClasses}
                          value={editData.serviceEndDate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              serviceEndDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Charges */}
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-700">
                        Additional Charges
                      </h3>
                      <button
                        onClick={addCharge}
                        className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 gap-1"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>
                    {editData.additionalCharges?.map(
                      (charge: any, i: number) => (
                        <div key={i} className="flex gap-2 items-center mb-2">
                          <input
                            type="text"
                            placeholder="Charge name"
                            className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs"
                            value={charge.name}
                            onChange={(e) =>
                              handleChargeChange(i, "name", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount"
                            className="w-28 border border-slate-200 rounded px-2 py-1.5 text-xs"
                            value={charge.amount}
                            onChange={(e) =>
                              handleChargeChange(i, "amount", e.target.value)
                            }
                          />
                          <button
                            onClick={() => removeCharge(i)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Summary */}
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 text-xs">
                        Subtotal (Items)
                      </span>
                      <span className="font-bold text-slate-700">
                        {(editData.amount || 0).toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-500 text-xs">
                        Platform Fee ({editData.platformFeeRate || 0}%)
                      </span>
                      <span className="font-semibold text-indigo-600">
                        +
                        {Math.round(
                          (editData.amount || 0) *
                            ((editData.platformFeeRate || 0) / 100),
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                    {editData.additionalCharges
                      ?.filter((c: any) => c.name)
                      .map((c: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm mt-1"
                        >
                          <span className="text-slate-500 text-xs">
                            {c.name}
                          </span>
                          <span className="font-semibold text-slate-700">
                            +{(c.amount || 0).toLocaleString()} MMK
                          </span>
                        </div>
                      ))}
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-indigo-200">
                      <span className="font-bold text-slate-800 text-xs uppercase">
                        Grand Total
                      </span>
                      <span className="font-extrabold text-indigo-600">
                        {grandTotal.toLocaleString()} MMK
                      </span>
                    </div>
                  </div>

                  {/* Save/Cancel */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="inline mr-1 h-4 w-4" />{" "}
                          {isNew ? "Create Invoice" : "Save Changes"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 mb-2">
                      Client
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={labelClasses}>Company</p>
                        <p className={valueClasses}>
                          {displayData.companyName}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${displayData.status === "Paid" ? "bg-emerald-100 text-emerald-700" : displayData.status === "Sent" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}
                      >
                        {displayData.status}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div>
                        <p className={labelClasses}>Contact</p>
                        <p className="text-xs font-semibold text-slate-700">
                          {displayData.contactPerson}{" "}
                          {displayData.contactInfo
                            ? `(${displayData.contactInfo})`
                            : ""}
                        </p>
                      </div>
                      {displayData.projectId && (
                        <div className="text-right">
                          <p className={labelClasses}>Project ID</p>
                          <p className="text-xs font-semibold text-indigo-600">
                            {displayData.projectId}
                          </p>
                        </div>
                      )}
                    </div>
                    {invoice?.paymentDetails && (
                      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <div>
                          <p className={labelClasses}>Payment Method</p>
                          <p className="text-xs font-semibold text-slate-700">
                            {invoice.paymentDetails.channel}
                          </p>
                        </div>
                        {invoice.paymentDetails.note && (
                          <div className="text-right">
                            <p className={labelClasses}>Note</p>
                            <p className="text-xs text-slate-500 italic">
                              "{invoice.paymentDetails.note}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 mb-2">
                      Service Items
                    </h3>
                    {displayData.items
                      ?.filter((i: InvoiceItem) => i.description)
                      .map((item: InvoiceItem, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {item.description}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.quantity} x{" "}
                              {item.unitPrice.toLocaleString()} MMK
                            </p>
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {item.amount.toLocaleString()} MMK
                          </span>
                        </div>
                      ))}
                    {(!displayData.items ||
                      displayData.items.filter(
                        (i: InvoiceItem) => i.description,
                      ).length === 0) && (
                      <p className="text-xs text-slate-400 italic">No items</p>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 mb-2">
                      Summary
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-semibold">
                          {(displayData.amount || 0).toLocaleString()} MMK
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Platform Fee ({displayData.platformFeeRate || 0}%)
                        </span>
                        <span className="font-semibold text-indigo-600">
                          +{currentPlatformFee.toLocaleString()} MMK
                        </span>
                      </div>
                      {displayData.additionalCharges
                        ?.filter((c: any) => c.name)
                        .map((c: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-500">{c.name}</span>
                            <span className="font-semibold">
                              +{(c.amount || 0).toLocaleString()} MMK
                            </span>
                          </div>
                        ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-800">
                          Grand Total
                        </span>
                        <span className="font-extrabold text-indigo-600">
                          {grandTotal.toLocaleString()} MMK
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <p className={labelClasses}>Invoice Date</p>
                        <p className="text-xs font-semibold">
                          {formatDate(displayData.date)}
                        </p>
                      </div>
                      <div>
                        <p className={labelClasses}>Due Date</p>
                        <p className="text-xs font-semibold">
                          {displayData.dueDate
                            ? formatDate(displayData.dueDate)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className={labelClasses}>Service Period</p>
                        <p className="text-xs font-semibold">
                          {displayData.serviceStartDate
                            ? formatDate(displayData.serviceStartDate)
                            : "N/A"}{" "}
                          -{" "}
                          {displayData.serviceEndDate
                            ? formatDate(displayData.serviceEndDate)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className={labelClasses}>Payment Method</p>
                        <p className="text-xs font-semibold">
                          {displayData.paymentMethod || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        {showPreview && (
          <div className="xl:col-span-8">
            <div className="space-y-3 animate-fadeIn xl:sticky xl:top-4">
              <div className="flex flex-wrap items-center justify-between bg-red border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setViewMode("invoice")}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === "invoice" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Invoice
                  </button>
                  <button
                    disabled={!isReceipt}
                    onClick={() => setViewMode("customer")}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!isReceipt ? "opacity-50 cursor-not-allowed" : ""} ${viewMode === "customer" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Receipt
                  </button>
                  <button
                    disabled={!isVoucher}
                    onClick={() => setViewMode("caregiver")}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!isVoucher ? "opacity-50 cursor-not-allowed" : ""} ${viewMode === "caregiver" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Voucher
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      downloadAsImage(
                        "document-preview",
                        `${viewMode === "invoice" ? "Invoice" : viewMode === "customer" ? "Receipt" : "Voucher"}-${invoice?.invoiceNumber || "NEW"}`,
                      )
                    }
                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-[11px] font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <ImageIcon className="mr-1 h-3 w-3 text-slate-400" /> PNG
                  </button>
                  <button
                    onClick={() =>
                      downloadAsPDF(
                        "document-preview",
                        `${viewMode === "invoice" ? "Invoice" : viewMode === "customer" ? "Receipt" : "Voucher"}-${invoice?.invoiceNumber || "NEW"}`,
                      )
                    }
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-[11px] font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <FileText className="mr-1 h-3 w-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Document Preview */}
              <div className="overflow-x-auto pb-8 rounded-2xl shadow-inner bg-slate-100/50">
                <div className="min-w-max flex justify-center p-4 lg:p-0">
                  <div className="shadow-2xl rounded-sm overflow-hidden">
                    <div
                      id="document-preview"
                      className="relative bg-white"
                      style={{
                        padding: "40px",
                        fontFamily:
                          "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        width: "800px",
                        minWidth: "800px",
                        color: "#1e293b",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "28px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <img
                            src="/otas.png"
                            alt="OTAS"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "contain",
                            }}
                          />
                          <div>
                            <span
                              style={{
                                fontSize: "22px",
                                fontWeight: 800,
                                color: "#4F46E5",
                                letterSpacing: "-0.5px",
                              }}
                            >
                              OTAS
                            </span>
                            <p
                              style={{
                                fontSize: "10px",
                                color: "#6b7280",
                                margin: 0,
                                fontWeight: 600,
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                              }}
                            >
                              Tech Solution
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <h1
                            style={{
                              fontSize: "28px",
                              fontWeight: 800,
                              color: "#4F46E5",
                              letterSpacing: "5px",
                              textTransform: "uppercase",
                              margin: 0,
                            }}
                          >
                            {viewMode === "invoice"
                              ? "INVOICE"
                              : viewMode === "customer"
                                ? "RECEIPT"
                                : "PAYMENT VOUCHER"}
                          </h1>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              margin: "4px 0 0",
                              fontWeight: 600,
                            }}
                          >
                            #{invoice?.invoiceNumber || "NEW"}
                          </p>
                        </div>
                      </div>

                      {/* Bill To / Dates */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "28px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              margin: "0 0 3px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Bill To:
                          </p>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#4F46E5",
                              margin: "0 0 3px",
                            }}
                          >
                            {displayData.companyName}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#374151",
                              margin: "0",
                            }}
                          >
                            {displayData.contactPerson}
                          </p>
                          {displayData.contactInfo && (
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#374151",
                                margin: "2px 0 0",
                              }}
                            >
                              {displayData.contactInfo}
                            </p>
                          )}
                          {displayData.projectId && (
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#6b7280",
                                margin: "2px 0 0",
                                fontWeight: 600,
                              }}
                            >
                              Project: {displayData.projectId}
                            </p>
                          )}
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: "11px",
                            color: "#374151",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "12px",
                              marginBottom: "3px",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              Invoice Date
                            </span>
                            <span>: {formatDate(displayData.date)}</span>
                          </div>
                          {displayData.dueDate && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                                marginBottom: "3px",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>Due Date</span>
                              <span>: {formatDate(displayData.dueDate)}</span>
                            </div>
                          )}
                          {displayData.serviceStartDate && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                Service Period
                              </span>
                              <span>
                                : {formatDate(displayData.serviceStartDate)} -{" "}
                                {displayData.serviceEndDate
                                  ? formatDate(displayData.serviceEndDate)
                                  : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Table */}
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginBottom: "0",
                        }}
                      >
                        <thead>
                          <tr>
                            {[
                              "#",
                              "Description",
                              "Qty",
                              "Unit Price",
                              "Amount",
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  backgroundColor: "#4F46E5",
                                  color: "#fff",
                                  padding: "8px 10px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  textAlign: h === "Amount" ? "right" : "left",
                                  border: "1px solid #4F46E5",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.items
                            ?.filter((i: InvoiceItem) => i.description)
                            .map((item: InvoiceItem, idx: number) => (
                              <tr key={idx}>
                                <td
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#374151",
                                    backgroundColor:
                                      idx % 2 === 0 ? "#f3f4f6" : "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "center",
                                    width: "30px",
                                  }}
                                >
                                  {idx + 1}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#374151",
                                    backgroundColor:
                                      idx % 2 === 0 ? "#f3f4f6" : "#ffffff",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  {item.description}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "11px",
                                    color: "#374151",
                                    backgroundColor:
                                      idx % 2 === 0 ? "#f3f4f6" : "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "center",
                                  }}
                                >
                                  {item.quantity}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "11px",
                                    color: "#374151",
                                    backgroundColor:
                                      idx % 2 === 0 ? "#f3f4f6" : "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "right",
                                  }}
                                >
                                  {item.unitPrice.toLocaleString()} MMK
                                </td>
                                <td
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#4F46E5",
                                    backgroundColor:
                                      idx % 2 === 0 ? "#f3f4f6" : "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "right",
                                  }}
                                >
                                  {item.amount.toLocaleString()} MMK
                                </td>
                              </tr>
                            ))}
                          {(!displayData.items ||
                            displayData.items.filter(
                              (i: InvoiceItem) => i.description,
                            ).length === 0) && (
                            <tr>
                              <td
                                colSpan={5}
                                style={{
                                  padding: "16px 10px",
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                  fontStyle: "italic",
                                  textAlign: "center",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                No items added
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Totals */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: "0",
                        }}
                      >
                        <div style={{ width: "300px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 10px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#374151",
                              }}
                            >
                              Subtotal
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#374151",
                              }}
                            >
                              {(displayData.amount || 0).toLocaleString()} MMK
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 10px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#374151",
                              }}
                            >
                              Platform Fee ({displayData.platformFeeRate || 0}%)
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#4F46E5",
                              }}
                            >
                              +{currentPlatformFee.toLocaleString()} MMK
                            </span>
                          </div>
                          {displayData.additionalCharges
                            ?.filter((c: any) => c.name)
                            .map((c: any, i: number) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 10px",
                                  borderBottom: "1px solid #e5e7eb",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#374151",
                                  }}
                                >
                                  {c.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#374151",
                                  }}
                                >
                                  +{(c.amount || 0).toLocaleString()} MMK
                                </span>
                              </div>
                            ))}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px",
                              backgroundColor: "#f3f4f6",
                              borderTop: "2px solid #4F46E5",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#374151",
                                textTransform: "uppercase",
                              }}
                            >
                              {viewMode === "caregiver"
                                ? "Payout Amount"
                                : "Grand Total"}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#4F46E5",
                              }}
                            >
                              {(viewMode === "caregiver"
                                ? displayData.amount || 0
                                : grandTotal
                              ).toLocaleString()}{" "}
                              MMK
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      {viewMode === "customer" && invoice?.paymentDetails ? (
                        <div
                          style={{
                            marginTop: "20px",
                            padding: "14px",
                            backgroundColor: "rgba(79,70,229,0.05)",
                            borderRadius: "8px",
                            border: "1px solid rgba(79,70,229,0.15)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              marginBottom: "10px",
                            }}
                          >
                            <ShieldCheck size={12} color="#4F46E5" />
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#4F46E5",
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                              }}
                            >
                              Payment Confirmation
                            </span>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Channel
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {invoice.paymentDetails.channel}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Amount
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {(
                                  invoice.paymentDetails.amount || 0
                                ).toLocaleString()}{" "}
                                MMK
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Payer
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {invoice.paymentDetails.senderName}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Date
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {invoice.paymentDetails.dateTime
                                  ? new Date(
                                      invoice.paymentDetails.dateTime,
                                    ).toLocaleString()
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : viewMode === "caregiver" && invoice?.payoutDetails ? (
                        <div
                          style={{
                            marginTop: "20px",
                            padding: "14px",
                            backgroundColor: "rgba(79,70,229,0.05)",
                            borderRadius: "8px",
                            border: "1px solid rgba(79,70,229,0.15)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              marginBottom: "10px",
                            }}
                          >
                            <ShieldCheck size={12} color="#4F46E5" />
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#4F46E5",
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                              }}
                            >
                              Payout Confirmation
                            </span>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Channel
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {invoice.payoutDetails.channel}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Amount
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {(
                                  invoice.payoutDetails.amount || 0
                                ).toLocaleString()}{" "}
                                MMK
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Receiver
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {invoice.payoutDetails.receiverName}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#9ca3af",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  margin: "0 0 3px",
                                }}
                              >
                                Date
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#111827",
                                  margin: 0,
                                }}
                              >
                                {invoice.payoutDetails.dateTime
                                  ? new Date(
                                      invoice.payoutDetails.dateTime,
                                    ).toLocaleString()
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Payment Methods */}
                      <div style={{ marginTop: "32px" }}>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            fontWeight: 700,
                            margin: "0 0 8px",
                          }}
                        >
                          Payment Method
                        </p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            fontSize: "11px",
                            color: "#374151",
                          }}
                        >
                          <div>
                            <h4
                              style={{
                                fontSize: "13px",
                                fontWeight: 900,
                                color: "#075CAB",
                                margin: "0 0 2px",
                                textTransform: "uppercase",
                              }}
                            >
                              KBZPay
                            </h4>
                            <p style={{ margin: "0", fontWeight: 600 }}>
                              09-XXX XXX XXX
                            </p>
                          </div>
                          <div>
                            <h4
                              style={{
                                fontSize: "13px",
                                fontWeight: 900,
                                color: "#A0222C",
                                margin: "0 0 2px",
                                textTransform: "uppercase",
                              }}
                            >
                              AYA Pay
                            </h4>
                            <p style={{ margin: "0", fontWeight: 600 }}>
                              09-XXX XXX XXX
                            </p>
                          </div>
                          <div>
                            <h4
                              style={{
                                fontSize: "13px",
                                fontWeight: 900,
                                color: "#FFE508",
                                margin: "0 0 2px",
                                textTransform: "uppercase",
                              }}
                            >
                              WavePay
                            </h4>
                            <p style={{ margin: "0", fontWeight: 600 }}>
                              09-XXX XXX XXX
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Signature */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          marginTop: "60px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#4F46E5",
                              lineHeight: 1.35,
                              margin: 0,
                              fontStyle: "italic",
                            }}
                          >
                            Thank you for your business!
                          </p>
                        </div>
                        <div style={{ textAlign: "center", minWidth: "160px" }}>
                          <div
                            style={{
                              width: "100px",
                              height: "1px",
                              backgroundColor: "#374151",
                              margin: "0 auto 6px",
                              opacity: 0.4,
                            }}
                          ></div>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#111827",
                              margin: "0 0 2px",
                            }}
                          >
                            OTAS Tech Solution
                          </p>
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              fontStyle: "italic",
                              margin: 0,
                            }}
                          >
                            Authorized Signature
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment / Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
              <h3 className="text-lg font-bold text-indigo-700">
                {modalType === "customer"
                  ? "Confirm Customer Payment"
                  : "Confirm Payout"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record the {modalType === "customer" ? "receipt" : "payout"} for{" "}
                {invoice?.invoiceNumber}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Channel
                </label>
                <select
                  className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 font-medium"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="KBZPay (Kpay)">KBZPay (Kpay)</option>
                  <option value="WavePay">WavePay</option>
                  <option value="AYAPay">AYAPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 font-medium"
                  value={
                    paymentAmount ||
                    (invoice ? invoice.amount + (invoice.platformFee || 0) : 0)
                  }
                  onChange={(e) =>
                    setPaymentAmount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              {modalType === "customer" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 font-medium"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={invoice?.companyName || ""}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Receiver Name
                    </label>
                    <input
                      type="text"
                      className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 font-medium"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder={invoice?.companyName || ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Account Name (Second Name)
                    </label>
                    <input
                      type="text"
                      className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 font-medium"
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      placeholder="Account name on bank/app"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 font-medium"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Note
                </label>
                <textarea
                  className="block w-full border border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50"
                  rows={2}
                  placeholder="Optional note..."
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setAdditionalNote("");
                  }}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    modalType === "customer"
                      ? handleConfirmPayment
                      : handleConfirmPayout
                  }
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {modalType === "customer"
                    ? "Confirm Payment"
                    : "Confirm Payout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
