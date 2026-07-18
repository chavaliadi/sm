import {
  Calculator,
  CheckCircle2,
  FileCheck2,
  Loader2,
  RefreshCw,
  Scale,
  Send,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataTable, type Column } from '@/components/common/DataTable';
import { AmountDisplay } from '@/components/lending/common/AmountDisplay';
import { DateDisplay } from '@/components/lending/common/DateDisplay';
import { StatusBadge } from '@/components/lending/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { masterRowsToOptions, useLendingOptionRows } from '@/hooks/lending/useLendingMasters';
import { useLifecycleMutations, useLoanLifecycle } from '@/hooks/lending/useLoanLifecycle';
import { useToast } from '@/hooks/use-toast';
import type {
  DocReleaseTracker,
  ForeclosureQuote,
  InterestRevivalRecord,
  NachPresentationRecord,
  OTSProposalRecord,
  PortalServiceRequestRecord,
  PrepaymentQuote,
  RateResetRecord,
  RestructureRecord,
  TransferOutRecord,
  WilfulDefaulterRecord,
  WriteOffRecord,
} from '@/services/lending/lifecycleApi';

interface LoanLifecycleWorkbenchProps {
  loanAccountId: string;
  totalOutstanding?: string | number | null;
  principalOutstanding?: string | number | null;
  interestOutstanding?: string | number | null;
  penalOutstanding?: string | number | null;
  chargesOutstanding?: string | number | null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function isPending(mutation: { isPending?: boolean; isLoading?: boolean }) {
  return mutation.isPending || mutation.isLoading;
}

function LoaderIcon() {
  return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
}

function QuoteBreakup({
  title,
  quote,
}: {
  title: string;
  quote: ForeclosureQuote | PrepaymentQuote | null;
}) {
  if (!quote) return null;
  const isForeclosure = 'foreclosureFee' in quote;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Fee source: {quote.feeSource.replace(/_/g, ' ')}
          {quote.feeRate !== '0' ? ` · ${quote.feeRate}%` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{isForeclosure ? 'Principal' : 'Prepayment'}</dt>
            <dd className="font-medium">
              <AmountDisplay
                amount={isForeclosure ? quote.principalOutstanding : quote.prepaymentAmount}
              />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{isForeclosure ? 'Interest' : 'Penalty'}</dt>
            <dd className="font-medium">
              <AmountDisplay amount={isForeclosure ? quote.interestAccrued : quote.penalty} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">GST on Charges</dt>
            <dd className="font-medium">
              <AmountDisplay amount={quote.gstOnCharges} />
            </dd>
          </div>
          {'otherCharges' in quote ? (
            <div>
              <dt className="text-muted-foreground">Other Charges</dt>
              <dd className="font-medium">
                <AmountDisplay amount={quote.otherCharges} />
              </dd>
            </div>
          ) : (
            <div>
              <dt className="text-muted-foreground">New Principal</dt>
              <dd className="font-medium">
                <AmountDisplay amount={quote.newPrincipalOutstanding} />
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Total Payable</dt>
            <dd className="font-semibold">
              <AmountDisplay amount={quote.totalPayable} />
            </dd>
          </div>
          {'validTill' in quote && (
            <div>
              <dt className="text-muted-foreground">Valid Till</dt>
              <dd className="font-medium">
                <DateDisplay date={quote.validTill} />
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

export function LoanLifecycleWorkbench({
  loanAccountId,
  totalOutstanding,
  principalOutstanding,
  interestOutstanding,
  penalOutstanding,
  chargesOutstanding,
}: LoanLifecycleWorkbenchProps) {
  const navigate = useNavigate();
  const lifecycle = useLoanLifecycle(loanAccountId);
  const mutations = useLifecycleMutations(loanAccountId);
  const { toast } = useToast();
  const prepaymentModeRows = useLendingOptionRows('PREPAYMENT_MODE');
  const writeOffTypeRows = useLendingOptionRows('WRITE_OFF_TYPE');
  const prepaymentModeOptions = masterRowsToOptions(prepaymentModeRows.data?.items);
  const writeOffTypeOptions = masterRowsToOptions(writeOffTypeRows.data?.items).map((option) => ({
    value: option.value.replace(/^WRITE_OFF_/, ''),
    label: option.label,
  }));

  const [foreclosureDate, setForeclosureDate] = useState(todayIso());
  const [foreclosureQuote, setForeclosureQuote] = useState<ForeclosureQuote | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [prepaymentMode, setPrepaymentMode] = useState('');
  const [prepaymentQuote, setPrepaymentQuote] = useState<PrepaymentQuote | null>(null);

  const [targetLenderName, setTargetLenderName] = useState('');
  const [outstandingAmount, setOutstandingAmount] = useState(String(totalOutstanding ?? '0'));
  const [quoteValidTill, setQuoteValidTill] = useState(addDaysIso(7));
  const [transferPaymentAmount, setTransferPaymentAmount] = useState(
    String(totalOutstanding ?? '0'),
  );
  const [transferPaymentReference, setTransferPaymentReference] = useState('');

  const [writeOffType, setWriteOffType] = useState('');
  const [writeOffAmount, setWriteOffAmount] = useState(String(totalOutstanding ?? '0'));
  const [writeOffPrincipal, setWriteOffPrincipal] = useState(String(principalOutstanding ?? '0'));
  const [writeOffInterest, setWriteOffInterest] = useState(String(interestOutstanding ?? '0'));
  const [writeOffCharges, setWriteOffCharges] = useState(
    String(Number(penalOutstanding ?? 0) + Number(chargesOutstanding ?? 0)),
  );
  const [writeOffReason, setWriteOffReason] = useState('');
  const [approvalAuthority, setApprovalAuthority] = useState('Credit Committee');

  const [documentName, setDocumentName] = useState('Original title/security documents');
  const [releaseReference, setReleaseReference] = useState('');

  useEffect(() => {
    if (!prepaymentMode && prepaymentModeOptions[0]?.value) {
      setPrepaymentMode(prepaymentModeOptions[0].value);
    }
  }, [prepaymentMode, prepaymentModeOptions]);

  useEffect(() => {
    if (!writeOffType && writeOffTypeOptions[0]?.value) {
      setWriteOffType(writeOffTypeOptions[0].value);
    }
  }, [writeOffType, writeOffTypeOptions]);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, title: string) => {
      try {
        await action();
        toast({ title });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The operation failed.';
        toast({ title: 'Lifecycle action failed', description: message, variant: 'destructive' });
      }
    },
    [toast],
  );

  const otsColumns = useMemo<Column<OTSProposalRecord>[]>(
    () => [
      { key: 'otsReference', header: 'Reference', sortable: true },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge status={row.status} type="loan" />,
      },
      {
        key: 'otsAmount',
        header: 'OTS Amount',
        align: 'right',
        render: (row) => <AmountDisplay amount={row.otsAmount} />,
      },
      {
        key: 'balancePending',
        header: 'Pending',
        align: 'right',
        render: (row) => <AmountDisplay amount={row.balancePending} />,
      },
      {
        key: 'validTill',
        header: 'Valid Till',
        render: (row) => <DateDisplay date={row.validTill} />,
      },
      {
        key: 'actions',
        header: 'Action',
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/lending/collections/ots/${row.id}`)}
          >
            Open
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const restructureColumns = useMemo<Column<RestructureRecord>[]>(
    () => [
      { key: 'restructureReference', header: 'Reference', sortable: true },
      { key: 'restructureType', header: 'Type' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge status={row.status} type="loan" />,
      },
      {
        key: 'postOutstandingPrincipal',
        header: 'Post Principal',
        align: 'right',
        render: (row) => <AmountDisplay amount={row.postOutstandingPrincipal} />,
      },
      {
        key: 'postTenureMonths',
        header: 'Post Tenure',
        render: (row) => `${row.postTenureMonths} mo`,
      },
      {
        key: 'actions',
        header: 'Action',
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/lending/collections/restructure/${row.id}`)}
          >
            Open
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const transferColumns = useMemo<Column<TransferOutRecord>[]>(
    () => [
      { key: 'transferReference', header: 'Reference', sortable: true },
      { key: 'targetLenderName', header: 'Target Lender', sortable: true },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge status={row.status} type="loan" />,
      },
      {
        key: 'outstandingAmountQuoted',
        header: 'Quoted',
        align: 'right',
        render: (row) =>
          row.outstandingAmountQuoted ? (
            <AmountDisplay amount={row.outstandingAmountQuoted} />
          ) : (
            '-'
          ),
      },
      {
        key: 'paymentAmount',
        header: 'Payment',
        align: 'right',
        render: (row) => (row.paymentAmount ? <AmountDisplay amount={row.paymentAmount} /> : '-'),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (row) => <DateDisplay date={row.createdAt} />,
      },
    ],
    [],
  );

  const portalRequestColumns = useMemo<Column<PortalServiceRequestRecord>[]>(
    () => [
      { key: 'requestNumber', header: 'Request No.', sortable: true },
      { key: 'requestType', header: 'Type', sortable: true },
      { key: 'subject', header: 'Subject' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge status={row.status} type="loan" />,
      },
      {
        key: 'quoteAmount',
        header: 'Quote',
        align: 'right',
        render: (row) => (row.quoteAmount ? <AmountDisplay amount={row.quoteAmount} /> : '-'),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (row) => <DateDisplay date={row.createdAt} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                runAction(
                  () =>
                    mutations.updatePortalRequest.mutateAsync({
                      requestId: row.id,
                      status: 'UNDER_REVIEW',
                      statusMessage: 'Under operations review',
                      reviewRemarks: 'Taken up from lifecycle workbench',
                    }),
                  'Portal request moved under review',
                )
              }
              disabled={row.status === 'UNDER_REVIEW' || row.status === 'COMPLETED'}
            >
              Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                runAction(
                  () =>
                    mutations.updatePortalRequest.mutateAsync({
                      requestId: row.id,
                      status: 'APPROVED',
                      statusMessage: 'Approved by operations',
                      reviewRemarks: 'Approved from lifecycle workbench',
                    }),
                  'Portal request approved',
                )
              }
              disabled={row.status === 'APPROVED' || row.status === 'COMPLETED'}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                runAction(
                  () =>
                    mutations.updatePortalRequest.mutateAsync({
                      requestId: row.id,
                      status: 'COMPLETED',
                      statusMessage: 'Completed by operations',
                      completionRemarks: 'Completed from lifecycle workbench',
                    }),
                  'Portal request completed',
                )
              }
              disabled={row.status === 'COMPLETED'}
            >
              Complete
            </Button>
          </div>
        ),
      },
    ],
    [mutations.updatePortalRequest, runAction],
  );

  const docColumns = useMemo<Column<DocReleaseTracker>[]>(
    () => [
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge status={row.status} type="loan" />,
      },
      {
        key: 'closureDate',
        header: 'Closure',
        render: (row) => <DateDisplay date={row.closureDate} />,
      },
      {
        key: 'targetReleaseDate',
        header: 'Target',
        render: (row) => <DateDisplay date={row.targetReleaseDate} />,
      },
      {
        key: 'compensationPayable',
        header: 'Compensation',
        align: 'right',
        render: (row) => <AmountDisplay amount={row.compensationPayable} />,
      },
    ],
    [],
  );

  const writeOffColumns = useMemo<Column<WriteOffRecord>[]>(
    () => [
      { key: 'writeOffReference', header: 'Reference', sortable: true },
      { key: 'writeOffType', header: 'Type', sortable: true },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge status={row.status} type="loan" />,
      },
      {
        key: 'proposedAmount',
        header: 'Amount',
        align: 'right',
        render: (row) => <AmountDisplay amount={row.proposedAmount} />,
      },
      {
        key: 'proposedDate',
        header: 'Proposed',
        render: (row) => <DateDisplay date={row.proposedDate} />,
      },
    ],
    [],
  );

  const rateResetColumns = useMemo<Column<RateResetRecord>[]>(
    () => [
      { key: 'benchmarkCode', header: 'Benchmark' },
      { key: 'oldRatePercent', header: 'Old Rate', align: 'right' },
      { key: 'newRatePercent', header: 'New Rate', align: 'right' },
      { key: 'borrowerChoice', header: 'Choice', render: (row) => row.borrowerChoice ?? '-' },
      { key: 'dueDate', header: 'Due', render: (row) => <DateDisplay date={row.dueDate} /> },
    ],
    [],
  );

  const simpleStatusColumns = useMemo<
    Column<NachPresentationRecord | InterestRevivalRecord | WilfulDefaulterRecord>[]
  >(
    () => [
      {
        key: 'reference',
        header: 'Reference',
        render: (row) =>
          'revivalReference' in row
            ? row.revivalReference
            : 'proceedingReference' in row
              ? row.proceedingReference
              : row.id,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <StatusBadge
            status={'stage' in row ? row.stage : 'status' in row ? row.status : 'RECORDED'}
            type="loan"
          />
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        render: (row) =>
          'amount' in row ? (
            <AmountDisplay amount={row.amount} />
          ) : 'proposedAmount' in row ? (
            <AmountDisplay amount={row.proposedAmount} />
          ) : 'outstandingAmount' in row ? (
            <AmountDisplay amount={row.outstandingAmount} />
          ) : (
            '-'
          ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (row) => <DateDisplay date={row.createdAt} />,
      },
    ],
    [],
  );

  const firstTransfer = lifecycle.data?.transfers[0];
  const firstWriteOff = lifecycle.data?.writeOffs[0];
  const firstDocTracker = lifecycle.data?.docReleaseTrackers[0];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="quotes">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="transfer">Transfer-Out</TabsTrigger>
          <TabsTrigger value="settlement">OTS & Restructure</TabsTrigger>
          <TabsTrigger value="writeoff">Write-Off</TabsTrigger>
          <TabsTrigger value="release">Document Release</TabsTrigger>
          <TabsTrigger value="registers">Registers</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4 pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Foreclosure Quote</CardTitle>
                <CardDescription>
                  Uses configured charge rules or loan account terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="foreclosureDate">Quote Date</Label>
                  <Input
                    id="foreclosureDate"
                    type="date"
                    value={foreclosureDate}
                    onChange={(event) => setForeclosureDate(event.target.value)}
                  />
                </div>
                <Button
                  onClick={() =>
                    runAction(async () => {
                      const quote = await mutations.foreclosureQuote.mutateAsync(foreclosureDate);
                      setForeclosureQuote(quote);
                    }, 'Foreclosure quote calculated')
                  }
                  disabled={isPending(mutations.foreclosureQuote)}
                >
                  {isPending(mutations.foreclosureQuote) ? (
                    <LoaderIcon />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Calculate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part Prepayment Quote</CardTitle>
                <CardDescription>
                  Calculates revised principal and configured charge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prepaymentAmount">Amount</Label>
                    <Input
                      id="prepaymentAmount"
                      inputMode="decimal"
                      value={prepaymentAmount}
                      onChange={(event) => setPrepaymentAmount(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                  <Select value={prepaymentMode} onValueChange={setPrepaymentMode}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {prepaymentModeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    runAction(async () => {
                      const quote = await mutations.prepaymentQuote.mutateAsync({
                        amount: prepaymentAmount,
                        mode: prepaymentMode,
                      });
                      setPrepaymentQuote(quote);
                    }, 'Prepayment quote calculated')
                  }
                  disabled={
                    !prepaymentAmount || !prepaymentMode || isPending(mutations.prepaymentQuote)
                  }
                >
                  {isPending(mutations.prepaymentQuote) ? (
                    <LoaderIcon />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Calculate
                </Button>
              </CardContent>
            </Card>
          </div>
          <QuoteBreakup title="Foreclosure Breakup" quote={foreclosureQuote} />
          <QuoteBreakup title="Prepayment Breakup" quote={prepaymentQuote} />
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer-Out Workflow</CardTitle>
              <CardDescription>
                NOC request, outstanding letter, payment, and closure.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="targetLenderName">Target Lender</Label>
                <Input
                  id="targetLenderName"
                  value={targetLenderName}
                  onChange={(event) => setTargetLenderName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outstandingAmount">Outstanding Quote</Label>
                <Input
                  id="outstandingAmount"
                  inputMode="decimal"
                  value={outstandingAmount}
                  onChange={(event) => setOutstandingAmount(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quoteValidTill">Valid Till</Label>
                <Input
                  id="quoteValidTill"
                  type="date"
                  value={quoteValidTill}
                  onChange={(event) => setQuoteValidTill(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferPaymentReference">Payment Reference</Label>
                <Input
                  id="transferPaymentReference"
                  value={transferPaymentReference}
                  onChange={(event) => setTransferPaymentReference(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferPaymentAmount">Payment Amount</Label>
                <Input
                  id="transferPaymentAmount"
                  inputMode="decimal"
                  value={transferPaymentAmount}
                  onChange={(event) => setTransferPaymentAmount(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 lg:col-span-4">
                <Button
                  onClick={() =>
                    runAction(
                      () => mutations.initiateTransfer.mutateAsync({ targetLenderName }),
                      'Transfer-out NOC requested',
                    )
                  }
                  disabled={!targetLenderName || isPending(mutations.initiateTransfer)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Request NOC
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    firstTransfer &&
                    runAction(
                      () =>
                        mutations.issueOutstanding.mutateAsync({
                          transferId: firstTransfer.id,
                          outstandingAmount,
                          validTill: quoteValidTill,
                        }),
                      'Outstanding letter issued',
                    )
                  }
                  disabled={!firstTransfer || isPending(mutations.issueOutstanding)}
                >
                  Issue Outstanding
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    firstTransfer &&
                    runAction(
                      () =>
                        mutations.recordTransferPayment.mutateAsync({
                          transferId: firstTransfer.id,
                          amount: transferPaymentAmount,
                          reference: transferPaymentReference,
                        }),
                      'Transfer payment recorded',
                    )
                  }
                  disabled={
                    !firstTransfer ||
                    !transferPaymentReference ||
                    isPending(mutations.recordTransferPayment)
                  }
                >
                  Record Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    firstTransfer &&
                    runAction(
                      () => mutations.closeTransfer.mutateAsync(firstTransfer.id),
                      'Transfer-out closed',
                    )
                  }
                  disabled={!firstTransfer || isPending(mutations.closeTransfer)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Close Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
          <DataTable
            data={lifecycle.data?.transfers ?? []}
            columns={transferColumns}
            getRowId={(row) => row.id}
            isLoading={lifecycle.isLoading}
            error={lifecycle.isError ? lifecycle.error : undefined}
            onRetry={() => lifecycle.refetch()}
            emptyTitle="No transfer-out records"
          />
          <Card>
            <CardHeader>
              <CardTitle>Borrower Portal Requests</CardTitle>
              <CardDescription>
                Foreclosure, transfer/NOC, and servicing requests raised by the borrower.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.portalRequests ?? []}
                columns={portalRequestColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No borrower portal requests for this account"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4 pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>OTS Workflow</CardTitle>
                <CardDescription>
                  Proposal, approval, borrower acceptance, payment tracking, and completion.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    navigate(`/admin/lending/collections/ots/new?accountId=${loanAccountId}`)
                  }
                >
                  <Scale className="mr-2 h-4 w-4" />
                  New OTS Proposal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/lending/collections/ots')}
                >
                  OTS Register
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Restructure Workflow</CardTitle>
                <CardDescription>
                  Proposal, maker-checker approval, and implementation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    navigate(
                      `/admin/lending/collections/restructure/new?accountId=${loanAccountId}`,
                    )
                  }
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Restructure
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/lending/collections/restructure')}
                >
                  Restructure Register
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>OTS Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.otsProposals ?? []}
                columns={otsColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No OTS proposals for this account"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Restructure Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.restructures ?? []}
                columns={restructureColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No restructure proposals for this account"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="writeoff" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Write-Off Maker-Checker</CardTitle>
              <CardDescription>
                Proposal, approval, and effecting are separate actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={writeOffType}
                    onValueChange={setWriteOffType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {writeOffTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writeOffAmount">Amount</Label>
                  <Input
                    id="writeOffAmount"
                    inputMode="decimal"
                    value={writeOffAmount}
                    onChange={(event) => setWriteOffAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvalAuthority">Approval Authority</Label>
                  <Input
                    id="approvalAuthority"
                    value={approvalAuthority}
                    onChange={(event) => setApprovalAuthority(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writeOffPrincipal">Principal</Label>
                  <Input
                    id="writeOffPrincipal"
                    value={writeOffPrincipal}
                    onChange={(event) => setWriteOffPrincipal(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writeOffInterest">Interest</Label>
                  <Input
                    id="writeOffInterest"
                    value={writeOffInterest}
                    onChange={(event) => setWriteOffInterest(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writeOffCharges">Charges</Label>
                  <Input
                    id="writeOffCharges"
                    value={writeOffCharges}
                    onChange={(event) => setWriteOffCharges(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="writeOffReason">Reason</Label>
                <Textarea
                  id="writeOffReason"
                  value={writeOffReason}
                  onChange={(event) => setWriteOffReason(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        mutations.proposeWriteOff.mutateAsync({
                          loanAccountId,
                          writeOffType,
                          amount: writeOffAmount,
                          reason: writeOffReason,
                          principal: writeOffPrincipal,
                          interest: writeOffInterest,
                          charges: writeOffCharges,
                        }),
                      'Write-off proposed',
                    )
                  }
                  disabled={!writeOffType || !writeOffReason || isPending(mutations.proposeWriteOff)}
                >
                  Propose
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    firstWriteOff &&
                    runAction(
                      () =>
                        mutations.approveWriteOff.mutateAsync({
                          writeOffId: firstWriteOff.id,
                          approvalAuthority,
                        }),
                      'Write-off approved',
                    )
                  }
                  disabled={!firstWriteOff || isPending(mutations.approveWriteOff)}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    firstWriteOff &&
                    runAction(
                      () => mutations.effectWriteOff.mutateAsync(firstWriteOff.id),
                      'Write-off effected',
                    )
                  }
                  disabled={!firstWriteOff || isPending(mutations.effectWriteOff)}
                >
                  Effect
                </Button>
              </div>
            </CardContent>
          </Card>
          <DataTable
            data={lifecycle.data?.writeOffs ?? []}
            columns={writeOffColumns}
            getRowId={(row) => row.id}
            isLoading={lifecycle.isLoading}
            error={lifecycle.isError ? lifecycle.error : undefined}
            onRetry={() => lifecycle.refetch()}
            emptyTitle="No write-off records"
          />
        </TabsContent>

        <TabsContent value="release" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Original Document Release</CardTitle>
              <CardDescription>
                Tracks RBI 30-day closure release and compensation clock.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseReference">Release Reference</Label>
                <Input
                  id="releaseReference"
                  value={releaseReference}
                  onChange={(event) => setReleaseReference(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() =>
                    firstDocTracker &&
                    runAction(
                      () =>
                        mutations.markDocsReleased.mutateAsync({
                          trackerId: firstDocTracker.id,
                          documentName,
                          releaseReference,
                        }),
                      'Documents marked released',
                    )
                  }
                  disabled={
                    !firstDocTracker || !releaseReference || isPending(mutations.markDocsReleased)
                  }
                >
                  <FileCheck2 className="mr-2 h-4 w-4" />
                  Mark Released
                </Button>
              </div>
            </CardContent>
          </Card>
          <DataTable
            data={lifecycle.data?.docReleaseTrackers ?? []}
            columns={docColumns}
            getRowId={(row) => row.id}
            isLoading={lifecycle.isLoading}
            error={lifecycle.isError ? lifecycle.error : undefined}
            onRetry={() => lifecycle.refetch()}
            emptyTitle="No document-release trackers"
          />
        </TabsContent>

        <TabsContent value="registers" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => lifecycle.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Rate Resets</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.rateResets ?? []}
                columns={rateResetColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No rate reset records"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>NACH Presentations</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.nachPresentations ?? []}
                columns={simpleStatusColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No NACH presentation records"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Interest Revival</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.interestRevivals ?? []}
                columns={simpleStatusColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No interest revival records"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Wilful Defaulter Proceedings</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={lifecycle.data?.wilfulDefaulters ?? []}
                columns={simpleStatusColumns}
                getRowId={(row) => row.id}
                isLoading={lifecycle.isLoading}
                emptyTitle="No wilful-defaulter proceedings"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
