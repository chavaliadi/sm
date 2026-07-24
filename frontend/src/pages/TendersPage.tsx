import { useEffect, useState, useCallback, type FormEvent } from "react";
import { getTenders, createTender, updateTender, getTenderBids, createBid, evaluateBids } from "@/api/tender";
import { getProjects } from "@/api/projects";
import type { TenderRead, BidRead, ProjectRead } from "@/types";
import { Loader2 } from "lucide-react";

// The full 14 stages of a tender from the RFP
const TENDER_STAGES = [
    "DRAFT", "INTERNAL_APPROVAL", "PUBLISHED", "CORRIGENDUM", "BID_SUBMISSION",
    "BID_CLOSING", "TECHNICAL_EVALUATION", "FINANCIAL_EVALUATION", "FINAL_EVALUATION",
    "APPROVAL", "LOA_ISSUED", "CONTRACT_GENERATED", "AWARDED", "CLOSED"
];

function TenderWorkflowStepper({ currentStatus }: { currentStatus: string }) {
    const currentIndex = TENDER_STAGES.indexOf(currentStatus);

    return (
        <div className="flex flex-col gap-2 w-full max-w-xl">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                {TENDER_STAGES.map((stage, i) => {
                    const isCompleted = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    const label = stage.replace(/_/g, ' ');

                    return (
                        <div key={stage} className="flex flex-col items-center flex-shrink-0 w-20 min-w-0">
                            <div className={`h-1.5 w-full rounded-full transition-colors ${isCompleted ? 'bg-sky-600' : isCurrent ? 'bg-amber-400 shadow-sm' : 'bg-gray-100'
                                }`} />
                            <span
                                className={`text-[8.5px] mt-1.5 text-center font-bold tracking-tight truncate w-full px-1 ${isCurrent ? 'text-amber-700' : isCompleted ? 'text-sky-700' : 'text-gray-400'
                                    }`}
                                title={label}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                Stage {currentIndex + 1} of 14: <span className="text-sky-700">{currentStatus.replace(/_/g, ' ')}</span>
            </div>
        </div>
    );
}

export function TendersPage() {
    const [tenders, setTenders] = useState<TenderRead[]>([]);
    const [projects, setProjects] = useState<ProjectRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
    const [tenderCode, setTenderCode] = useState("");
    const [tenderTitle, setTenderTitle] = useState("");
    const [tenderDesc, setTenderDesc] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ad-hoc modal to change state
    const [statusModalTender, setStatusModalTender] = useState<TenderRead | null>(null);
    const [newStatus, setNewStatus] = useState<string>("");

    // Bids modal state
    const [bidsModalTender, setBidsModalTender] = useState<TenderRead | null>(null);
    const [bids, setBids] = useState<BidRead[]>([]);
    const [loadingBids, setLoadingBids] = useState(false);
    const [bidderName, setBidderName] = useState("");
    const [bidderOrg, setBidderOrg] = useState("");
    const [bidderEmail, setBidderEmail] = useState("");
    const [docRef, setDocRef] = useState("");
    const [technicalScore, setTechnicalScore] = useState<number | "">("");
    const [financialAmount, setFinancialAmount] = useState<number | "">("");
    const [bidError, setBidError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tendersRes, projRes] = await Promise.all([getTenders(), getProjects({ page_size: 100 })]);
            setTenders(tendersRes.data || []);
            setProjects(projRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || "Failed to load Tenders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleCreateSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId) {
            setCreateError("Please select a project.");
            return;
        }
        setIsSubmitting(true);
        setCreateError(null);
        try {
            await createTender({
                project_id: Number(selectedProjectId),
                tender_code: tenderCode,
                title: tenderTitle,
                description: tenderDesc,
            });
            setIsCreateOpen(false);
            setSelectedProjectId("");
            setTenderCode("");
            setTenderTitle("");
            setTenderDesc("");
            await loadData();
        } catch (err: any) {
            setCreateError(err.response?.data?.error?.message || "Failed to create Tender.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusModalTender || !newStatus) return;
        setIsSubmitting(true);
        try {
            await updateTender(statusModalTender.id, { status: newStatus });
            setStatusModalTender(null);
            await loadData();
        } catch (err: any) {
            alert(err.response?.data?.error?.message || "Failed to update status.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenBids = async (tender: TenderRead) => {
        setBidsModalTender(tender);
        setLoadingBids(true);
        setBidError(null);
        setBidderName("");
        setBidderOrg("");
        setBidderEmail("");
        setDocRef("");
        setTechnicalScore("");
        setFinancialAmount("");
        try {
            const res = await getTenderBids(tender.id);
            setBids(res.data || []);
        } catch (err: any) {
            alert(err.response?.data?.error?.message || "Failed to load bids.");
        } finally {
            setLoadingBids(false);
        }
    };

    const handleSubmitBid = async (e: FormEvent) => {
        e.preventDefault();
        if (!bidsModalTender) return;
        setIsSubmitting(true);
        setBidError(null);
        try {
            await createBid(bidsModalTender.id, {
                tender_id: bidsModalTender.id,
                bidder_name: bidderName,
                organization: bidderOrg || undefined,
                contact_email: bidderEmail || undefined,
                document_ref: docRef || undefined,
                technical_score: technicalScore === "" ? undefined : Number(technicalScore),
                financial_amount: financialAmount === "" ? undefined : Number(financialAmount),
            });
            setBidderName("");
            setBidderOrg("");
            setBidderEmail("");
            setDocRef("");
            setTechnicalScore("");
            setFinancialAmount("");
            const res = await getTenderBids(bidsModalTender.id);
            setBids(res.data || []);
        } catch (err: any) {
            setBidError(err.response?.data?.error?.message || "Failed to submit bid.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRunEvaluation = async () => {
        if (!bidsModalTender) return;
        setIsSubmitting(true);
        try {
            await evaluateBids(bidsModalTender.id);
            const res = await getTenderBids(bidsModalTender.id);
            setBids(res.data || []);
            alert("Bid evaluation (L1-L3 analysis) ran successfully!");
        } catch (err: any) {
            alert(err.response?.data?.error?.message || "Failed to run evaluation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProjectCode = (projectId: number) => {
        const proj = projects.find((p) => p.id === projectId);
        return proj ? `${proj.project_code}` : `#${projectId}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Enterprise Procurement
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage full lifecycle 14-stage tendering, LOAs, contracts and AI L1 analysis.
                    </p>
                </div>
                <button
                    onClick={() => { setIsCreateOpen(true); setCreateError(null); }}
                    className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800"
                >
                    + Draft Tender Request
                </button>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <h3 className="font-semibold text-red-800">Error Loading Data</h3>
                    <p className="mt-1">{error}</p>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <div className="flex h-48 items-center justify-center text-sm text-gray-500"><Loader2 className="animate-spin w-5 h-5 mr-2" /> Loading...</div>
                ) : tenders.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-sm text-gray-500">
                        <p className="font-semibold text-gray-700">No Active Tenders</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Tender Identity</th>
                                    <th className="px-4 py-3">RFP Status Progress</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {tenders.map((tender) => (
                                    <tr key={tender.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="font-mono text-xs font-bold text-indigo-900">{tender.tender_code}</div>
                                            <div className="font-semibold text-gray-900 mt-0.5">{tender.title}</div>
                                            <div className="text-[11px] text-gray-500 mt-1">Project: {getProjectCode(tender.project_id)}</div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">Created: {new Date(tender.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <TenderWorkflowStepper currentStatus={tender.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right align-middle space-x-2">
                                            <button
                                                onClick={() => {
                                                    setStatusModalTender(tender);
                                                    setNewStatus(tender.status);
                                                }}
                                                className="rounded bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                                            >
                                                Advance State
                                            </button>
                                            <button
                                                onClick={() => void handleOpenBids(tender)}
                                                className="rounded bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm"
                                            >
                                                Bid Vault & Eval
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900">Initiate Tender (DRAFT)</h2>
                        <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                            {createError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{createError}</div>}
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Parent Project</label>
                                <select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(Number(e.target.value))} className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    <option value="">-- Choose Sanctioned Project --</option>
                                    {projects.map((proj) => (
                                        <option key={proj.id} value={proj.id}>{proj.project_code} - {proj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Tender Code (Immutable)</label>
                                <input required value={tenderCode} onChange={(e) => setTenderCode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 border p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Short Title</label>
                                <input required value={tenderTitle} onChange={(e) => setTenderTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 border p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Scope Description</label>
                                <textarea rows={3} value={tenderDesc} onChange={(e) => setTenderDesc(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 border p-2 text-sm" />
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 flex items-center">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish Draft</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Advance Status Modal */}
            {statusModalTender && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
                        <h2 className="font-bold text-lg">Advance Tender State</h2>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Current state is {statusModalTender.status}. (Warning: The backend state machine will reject illegal transitions.)</p>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="block w-full border-gray-300 border rounded-md p-2 text-sm mb-4"
                        >
                            {TENDER_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setStatusModalTender(null)} className="px-3 py-1.5 border rounded-md text-sm font-medium">Cancel</button>
                            <button onClick={() => void handleStatusUpdate()} disabled={isSubmitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bid Vault Modal */}
            {bidsModalTender && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl border border-gray-200 bg-gray-50 shadow-2xl overflow-hidden">

                        {/* Header */}
                        <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Bid Vault & Evaluation</h2>
                                <p className="text-sm font-medium text-indigo-700 mt-0.5">Tender ID: {bidsModalTender.tender_code} | Stage: {bidsModalTender.status}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {["TECHNICAL_EVALUATION", "FINANCIAL_EVALUATION", "FINAL_EVALUATION"].includes(bidsModalTender.status) && (
                                    <button
                                        onClick={() => void handleRunEvaluation()}
                                        disabled={isSubmitting}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run L1/L2 AI Evaluation"}
                                    </button>
                                )}
                                <button onClick={() => setBidsModalTender(null)} className="rounded-full hover:bg-gray-100 p-2">✕</button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Col: Bids List */}
                            <div className="flex-1 bg-white p-6 overflow-y-auto">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Received Bids</h3>
                                {loadingBids ? (
                                    <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></div>
                                ) : bids.length === 0 ? (
                                    <div className="p-12 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">Vault is empty. No bids submitted yet.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {bids.map(bid => (
                                            <div key={bid.id} className={`p-4 border rounded-xl relative overflow-hidden transition-all ${bid.is_l1 ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-white'}`}>
                                                {bid.is_l1 && (
                                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider">
                                                        L1 LOWEST BIDDER
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start pr-24">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900">{bid.bidder_name}</h4>
                                                        <div className="text-xs text-gray-500 flex gap-3 mt-1">
                                                            <span>Org: <span className="font-medium text-gray-700">{bid.organization || 'N/A'}</span></span>
                                                            <span>|</span>
                                                            <span>Contact: <span className="font-medium text-gray-700">{bid.contact_email || 'N/A'}</span></span>
                                                        </div>
                                                    </div>
                                                    {bid.financial_rank && !bid.is_l1 && (
                                                        <div className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded border">RANK L{bid.financial_rank}</div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tech Score</div>
                                                        <div className="font-mono text-sm mt-0.5">{bid.technical_score ?? "Pending"}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Financial Quo</div>
                                                        <div className={`font-mono text-sm mt-0.5 font-bold ${bid.is_l1 ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                            {bid.financial_amount ? `₹${bid.financial_amount.toLocaleString()}` : "Sealed"}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Documents & Sig</div>
                                                        <div className="text-xs mt-1 flex items-center gap-2">
                                                            {bid.document_ref ? (
                                                                <span className="truncate max-w-[120px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono" title={bid.document_ref}>{bid.document_ref}</span>
                                                            ) : (
                                                                <span className="text-gray-400 italic">No Uploads</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${bid.signature_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                SIG {bid.signature_status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Submit Bid Form */}
                            <div className="w-80 lg:w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Submit Bid (Portal)</h3>

                                {(!["PUBLISHED", "BID_SUBMISSION"].includes(bidsModalTender.status)) ? (
                                    <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                                        <strong>Bidding is locked.</strong>
                                        <p className="mt-1 text-xs">The tender is currently in the {bidsModalTender.status} stage. The vault only accepts encrypted bids during PUBLISHED or BID_SUBMISSION stages.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitBid} className="space-y-4">
                                        {bidError && <div className="text-xs text-red-600 bg-red-100 p-3 rounded-lg font-medium">{bidError}</div>}

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 uppercase">Contractor / Bidder Name *</label>
                                                <input required value={bidderName} onChange={(e) => setBidderName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Firm Legal Name" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 uppercase">Organization (RFP Entity)</label>
                                                <input value={bidderOrg} onChange={(e) => setBidderOrg(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. L&T Ltd" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 uppercase">SPOC Contact Email</label>
                                                <input type="email" value={bidderEmail} onChange={(e) => setBidderEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="spoc@firm.com" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 uppercase">Encrypted Documents Ref</label>
                                                <input value={docRef} onChange={(e) => setDocRef(e.target.value)} className="mt-1 block w-full font-mono text-xs rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. tender_response.pdf" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-emerald-800 uppercase">Financial (₹) *</label>
                                                    <input required type="number" step="0.01" value={financialAmount} onChange={(e) => setFinancialAmount(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 block w-full rounded-md border-emerald-300 shadow-sm sm:text-sm focus:ring-emerald-500 font-mono" placeholder="₹ Amount" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Tech Score %</label>
                                                    <input type="number" step="0.1" value={technicalScore} onChange={(e) => setTechnicalScore(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:ring-indigo-500 font-mono" placeholder="0-100" />
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-indigo-900 text-white py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-800 transition flex items-center justify-center gap-2">
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit & Encrypt Bid"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
