import { apiClient } from "@/api/client";
import type { PaginatedResponse, TenderRead, TenderCreate, TenderUpdate, BidRead, BidCreate, BidUpdate } from "@/types";

interface SuccessResponse<T> {
    data: T;
    meta: Record<string, never>;
}

export async function getTenders(page = 1, page_size = 20): Promise<PaginatedResponse<TenderRead>> {
    const response = await apiClient.get<PaginatedResponse<TenderRead>>("/tenders", {
        params: { page, page_size },
    });
    return response.data;
}

export async function createTender(body: TenderCreate): Promise<TenderRead> {
    const response = await apiClient.post<SuccessResponse<TenderRead>>("/tenders", body);
    return response.data.data;
}

export async function updateTender(id: number, body: TenderUpdate): Promise<TenderRead> {
    const response = await apiClient.put<SuccessResponse<TenderRead>>(`/tenders/${id}`, body);
    return response.data.data;
}

export async function deleteTender(id: number): Promise<TenderRead> {
    const response = await apiClient.delete<SuccessResponse<TenderRead>>(`/tenders/${id}`);
    return response.data.data;
}

export async function getTenderBids(tenderId: number, page = 1, page_size = 20): Promise<PaginatedResponse<BidRead>> {
    const response = await apiClient.get<PaginatedResponse<BidRead>>(`/tenders/${tenderId}/bids`, {
        params: { page, page_size },
    });
    return response.data;
}

export async function createBid(tenderId: number, body: BidCreate): Promise<BidRead> {
    const response = await apiClient.post<SuccessResponse<BidRead>>(`/tenders/${tenderId}/bids`, body);
    return response.data.data;
}

export async function updateBid(bidId: number, body: BidUpdate): Promise<BidRead> {
    const response = await apiClient.put<SuccessResponse<BidRead>>(`/tenders/bids/${bidId}`, body);
    return response.data.data;
}
