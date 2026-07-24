import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";
import type {
  ContractCreate,
  ContractListFilters,
  ContractRead,
  ContractUpdate,
  WorkOrderCreate,
  WorkOrderRead,
  WorkOrderUpdate,
} from "./types";

interface SuccessResponse<T> {
  data: T;
  meta: Record<string, never>;
}

// ── Contracts ─────────────────────────────────────────────────────────

export async function getContracts(
  page: number,
  pageSize: number,
  filters: ContractListFilters,
): Promise<PaginatedResponse<ContractRead>> {
  const response = await apiClient.get<PaginatedResponse<ContractRead>>(
    "/contracts",
    { params: { page, page_size: pageSize, ...filters } },
  );
  return response.data;
}

export async function getContract(contractId: number): Promise<ContractRead> {
  const response = await apiClient.get<SuccessResponse<ContractRead>>(
    `/contracts/${contractId}`,
  );
  return response.data.data;
}

export async function createContract(body: ContractCreate): Promise<ContractRead> {
  const response = await apiClient.post<SuccessResponse<ContractRead>>(
    "/contracts",
    body,
  );
  return response.data.data;
}

export async function updateContract(
  contractId: number,
  body: ContractUpdate,
): Promise<ContractRead> {
  const response = await apiClient.put<SuccessResponse<ContractRead>>(
    `/contracts/${contractId}`,
    body,
  );
  return response.data.data;
}

export async function deleteContract(contractId: number): Promise<ContractRead> {
  const response = await apiClient.delete<SuccessResponse<ContractRead>>(
    `/contracts/${contractId}`,
  );
  return response.data.data;
}

// ── Work Orders ───────────────────────────────────────────────────────

export async function getWorkOrders(
  contractId: number,
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<WorkOrderRead>> {
  const response = await apiClient.get<PaginatedResponse<WorkOrderRead>>(
    `/contracts/${contractId}/work-orders`,
    { params: { page, page_size: pageSize } },
  );
  return response.data;
}

export async function createWorkOrder(
  contractId: number,
  body: WorkOrderCreate,
): Promise<WorkOrderRead> {
  const response = await apiClient.post<SuccessResponse<WorkOrderRead>>(
    `/contracts/${contractId}/work-orders`,
    body,
  );
  return response.data.data;
}

export async function updateWorkOrder(
  contractId: number,
  workOrderId: number,
  body: WorkOrderUpdate,
): Promise<WorkOrderRead> {
  const response = await apiClient.put<SuccessResponse<WorkOrderRead>>(
    `/contracts/${contractId}/work-orders/${workOrderId}`,
    body,
  );
  return response.data.data;
}

export async function deleteWorkOrder(
  contractId: number,
  workOrderId: number,
): Promise<WorkOrderRead> {
  const response = await apiClient.delete<SuccessResponse<WorkOrderRead>>(
    `/contracts/${contractId}/work-orders/${workOrderId}`,
  );
  return response.data.data;
}
