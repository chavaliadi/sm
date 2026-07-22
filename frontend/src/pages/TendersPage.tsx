import { useEffect, useState, useCallback, type FormEvent } from "react";
import { getTenders, createTender, getTenderBids, createBid } from "@/api/tender";
import { getProjects } from "@/api/projects";
import type { TenderRead, BidRead, ProjectRead } from "@/types";

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
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bids modal state
    const [bidsModalTender, setBidsModalTender] = useState<TenderRead | null>(null);
    const [bids, setBids] = useState<BidRead[]>([]);
    const [loadingBids, setLoadingBids] = useState(false);
    const [bidderName, setBidderName] = useState("");
    const [bidError, setBidError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tendersRes, projRes] = await Promise.all([getTenders(), getProjects({ page_size: 100 })]);
            setTenders(tendersRes.data || []);
            setProjects(projRes.data || []);
        } catch (err: any) {
            console.error("Failed to load Tenders:", err);
            setError(
                err.response?.data?.error?.message ||
                (err instanceof Error ? err.message : "Failed to load Tenders.")
            );
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
            });
            setIsCreateOpen(false);
            setSelectedProjectId("");
            setTenderCode("");
            setTenderTitle("");
            await loadData();
        } catch (err: any) {
            setCreateError(
                err.response?.data?.error?.message ||
                (err instanceof Error ? err.message : "Failed to create Tender.")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenBids = async (tender: TenderRead) => {
        setBidsModalTender(tender);
        setLoadingBids(true);
        setBidError(null);
        setBidderName("");
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
            });
            setBidderName("");
            // Refresh bids
            const res = await getTenderBids(bidsModalTender.id);
            setBids(res.data || []);
        } catch (err: any) {
            setBidError(
                err.response?.data?.error?.message || "Failed to submit bid."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProjectCode = (projectId: number) => {
        const proj = projects.find((p) => p.id === projectId);
        return proj ? `${proj.project_code} - ${proj.name}` : `Project #${projectId}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Tender & Bidding Operations
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Publish tenders and manage bidding functionality securely.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setIsCreateOpen(true);
                        setCreateError(null);
                    }}
                    className="rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800"
                >
                    + New Tender
                </button>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    <h3 className="font-semibold text-red-800">Error Loading Data</h3>
                    <p className="mt-1">{error}</p>
                    <button
                        onClick={() => void loadData()}
                        className="mt-2 rounded bg-red-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-800"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <div className="flex h-48 items-center justify-center text-xs text-gray-500">
                        Loading Tenders...
                    </div>
                ) : tenders.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-xs text-gray-500">
                        <p className="font-semibold text-gray-700">No Tenders Found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Tender Code</th>
                                    <th scope="col" className="px-4 py-3">Title</th>
                                    <th scope="col" className="px-4 py-3">Project Reference</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {tenders.map((tender) => (
                                    <tr key={tender.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-sky-800">
                                            {tender.tender_code}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {tender.title}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-600">
                                            {getProjectCode(tender.project_id)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tender.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {tender.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => void handleOpenBids(tender)}
                                                className="rounded bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-200"
                                            >
                                                View Bids / Bid
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900">Create New Tender</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Create a tender in DRAFT mode.
                        </p>

                        {createError && (
                            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700">Select Project *</label>
                                <select
                                    required
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">-- Choose Active Project --</option>
                                    {projects.map((proj) => (
                                        <option key={proj.id} value={proj.id}>{proj.project_code} - {proj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700">Tender Code *</label>
                                <input
                                    required
                                    value={tenderCode}
                                    onChange={(e) => setTenderCode(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700">Title *</label>
                                <input
                                    required
                                    value={tenderTitle}
                                    onChange={(e) => setTenderTitle(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:ring-sky-500"
                                />
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="rounded-md bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {bidsModalTender && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
                        <div className="flex justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Bids for {bidsModalTender.tender_code}</h2>
                            <button onClick={() => setBidsModalTender(null)} className="text-xs font-semibold text-gray-500">Close</button>
                        </div>

                        <div className="mt-4 flex gap-4">
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Existing Bids</h3>
                                {loadingBids ? (
                                    <p className="text-xs text-gray-500">Loading bids...</p>
                                ) : bids.length === 0 ? (
                                    <p className="text-xs text-gray-500">No bids submitted yet.</p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {bids.map(bid => (
                                            <div key={bid.id} className="p-3 bg-gray-50 border border-gray-100 rounded-md text-xs">
                                                <div className="font-semibold">{bid.bidder_name}</div>
                                                <div className="text-gray-500 mt-1">Status: {bid.status}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 border-l border-gray-200 pl-4">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Submit a Bid</h3>
                                {bidsModalTender.status !== "PUBLISHED" ? (
                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                        Bids can only be submitted for PUBLISHED tenders.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitBid}>
                                        {bidError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">{bidError}</div>}
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-700">Bidder Name *</label>
                                            <input
                                                required
                                                value={bidderName}
                                                onChange={(e) => setBidderName(e.target.value)}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs"
                                            />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} className="mt-3 w-full rounded-md bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                                            {isSubmitting ? "Submitting..." : "Submit Bid"}
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
