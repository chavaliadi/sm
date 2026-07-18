import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormSection } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAccounts } from '@/hooks/finance/useAccounts';
import type {
  MoneyComponentGroup,
  MoneyComponentType,
  MoneyPostingRule,
} from '@/services/accounting/moneyEventsApi';
import {
  moneyComponentGroups,
  moneyPostingSides,
  type MoneyComponentTypeCreateRequest,
  type MoneyComponentTypeUpdateRequest,
  type MoneyPostingRuleCreateRequest,
  type MoneyPostingRuleUpdateRequest,
} from '@/services/accounting/moneyEventsApi';

const noSelection = '__none__';

const partyPolicyOptions = ['SOURCE', 'NONE', 'TRANSACTION_PARTY', 'COUNTERPARTY'] as const;
const recognitionMethodOptions = ['IMMEDIATE', 'ACCRUAL', 'ON_RECEIPT', 'ON_PAYMENT'] as const;

const optionalDate = z.string().optional().nullable();
const optionalUuid = z.string().uuid().optional().nullable();
const optionalRate = z
  .string()
  .optional()
  .nullable()
  .refine((value) => value == null || value === '' || Number(value) >= 0, {
    message: 'Rate must be zero or more',
  });

const componentSchema = z.object({
  code: z.string().trim().min(2, 'Code is required').max(80),
  label: z.string().trim().min(2, 'Label is required').max(200),
  componentGroup: z.custom<MoneyComponentGroup>(
    (value) => moneyComponentGroups.includes(value as MoneyComponentGroup),
    'Select a valid group',
  ),
  description: z.string().optional().nullable(),
  gstApplicable: z.boolean(),
  gstRatePercent: optionalRate,
  hsnSacCode: z.string().max(20).optional().nullable(),
  tdsApplicable: z.boolean(),
  tcsApplicable: z.boolean(),
  defaultAccountId: optionalUuid,
  defaultCostCenterId: optionalUuid,
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  effectiveTo: optionalDate,
  isActive: z.boolean(),
});

type ComponentFormValues = z.infer<typeof componentSchema>;

const postingRuleSchema = z.object({
  sourceModule: z.string().trim().min(2, 'Source module is required').max(80),
  eventCode: z.string().trim().min(2, 'Event code is required').max(100),
  componentCode: z.string().trim().min(2, 'Component code is required').max(80),
  postingSide: z.enum(moneyPostingSides),
  accountId: z.string().uuid('Account is required'),
  costCenterId: optionalUuid,
  partyPolicy: z.enum(partyPolicyOptions),
  recognitionMethod: z.enum(recognitionMethodOptions),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  effectiveTo: optionalDate,
  notes: z.string().optional().nullable(),
  isActive: z.boolean(),
});

type PostingRuleFormValues = z.infer<typeof postingRuleSchema>;

interface AccountOption {
  id: string;
  code: string;
  name: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function cleanText(value?: string | null): string | null {
  const next = value?.trim() ?? '';
  return next.length > 0 ? next : null;
}

function toOptionalUuid(value?: string | null): string | null {
  return value && value !== noSelection ? value : null;
}

function accountLabel(account: AccountOption): string {
  return `${account.code} - ${account.name}`;
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  ).sort((first, second) => first.localeCompare(second));
}

interface MoneyComponentDialogProps {
  open: boolean;
  component: MoneyComponentType | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: MoneyComponentTypeCreateRequest) => Promise<void>;
  onUpdate: (id: string, payload: MoneyComponentTypeUpdateRequest) => Promise<void>;
  saving?: boolean;
}

export function MoneyComponentDialog({
  open,
  component,
  onOpenChange,
  onCreate,
  onUpdate,
  saving = false,
}: MoneyComponentDialogProps): JSX.Element {
  const accounts = useAccounts();
  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: getComponentDefaults(component),
  });

  useEffect(() => {
    form.reset(getComponentDefaults(component));
  }, [component, form, open]);

  const submit = async (values: ComponentFormValues) => {
    const payload = {
      label: values.label.trim(),
      componentGroup: values.componentGroup,
      description: cleanText(values.description),
      gstApplicable: values.gstApplicable,
      gstRatePercent: cleanText(values.gstRatePercent),
      hsnSacCode: cleanText(values.hsnSacCode),
      tdsApplicable: values.tdsApplicable,
      tcsApplicable: values.tcsApplicable,
      defaultAccountId: toOptionalUuid(values.defaultAccountId),
      defaultCostCenterId: toOptionalUuid(values.defaultCostCenterId),
      effectiveFrom: values.effectiveFrom,
      effectiveTo: cleanText(values.effectiveTo),
    };
    if (component) {
      await onUpdate(component.id, { ...payload, isActive: values.isActive });
    } else {
      await onCreate({
        ...payload,
        code: values.code.trim().toUpperCase(),
        isSystem: false,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{component ? 'Edit money component' : 'Create money component'}</DialogTitle>
          <DialogDescription>
            Define the accounting component used by fees, GST, TDS, penalties, write-offs and source
            transactions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
            <FormSection title="Component details">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!component} placeholder="PROCESSING_FEE" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Processing fee" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="componentGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moneyComponentGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default account</FormLabel>
                    <Select
                      value={field.value ?? noSelection}
                      onValueChange={(value) => field.onChange(toOptionalUuid(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional default GL account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={noSelection}>No default account</SelectItem>
                        {(accounts.data ?? []).map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {accountLabel(account)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Tax and effective dating">
              <FormField
                control={form.control}
                name="gstApplicable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>GST applicable</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstRatePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST rate %</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} inputMode="decimal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsnSacCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN/SAC</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tdsApplicable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>TDS applicable</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tcsApplicable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>TCS applicable</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective from</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective to</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </FormSection>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || accounts.isLoading}>
                {saving ? 'Saving...' : 'Save component'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface MoneyPostingRuleDialogProps {
  open: boolean;
  rule: MoneyPostingRule | null;
  components: MoneyComponentType[];
  rules: MoneyPostingRule[];
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: MoneyPostingRuleCreateRequest) => Promise<void>;
  onUpdate: (id: string, payload: MoneyPostingRuleUpdateRequest) => Promise<void>;
  saving?: boolean;
}

export function MoneyPostingRuleDialog({
  open,
  rule,
  components,
  rules,
  onOpenChange,
  onCreate,
  onUpdate,
  saving = false,
}: MoneyPostingRuleDialogProps): JSX.Element {
  const accounts = useAccounts();
  const form = useForm<PostingRuleFormValues>({
    resolver: zodResolver(postingRuleSchema),
    defaultValues: getPostingRuleDefaults(rule),
  });

  useEffect(() => {
    form.reset(getPostingRuleDefaults(rule));
  }, [form, open, rule]);

  const selectedSourceModule = form.watch('sourceModule');
  const sourceModuleOptions = uniqueSorted([
    ...rules.map((item) => item.sourceModule),
    rule?.sourceModule,
  ]);
  const eventCodeOptions = uniqueSorted([
    ...rules
      .filter((item) => !selectedSourceModule || item.sourceModule === selectedSourceModule)
      .map((item) => item.eventCode),
    rule?.eventCode,
  ]);

  const submit = async (values: PostingRuleFormValues) => {
    const payload = {
      accountId: values.accountId,
      costCenterId: toOptionalUuid(values.costCenterId),
      partyPolicy: values.partyPolicy,
      recognitionMethod: values.recognitionMethod,
      effectiveFrom: values.effectiveFrom,
      effectiveTo: cleanText(values.effectiveTo),
      notes: cleanText(values.notes),
    };
    if (rule) {
      await onUpdate(rule.id, { ...payload, isActive: values.isActive });
    } else {
      await onCreate({
        ...payload,
        sourceModule: values.sourceModule.trim().toUpperCase(),
        eventCode: values.eventCode.trim().toUpperCase(),
        componentCode: values.componentCode.trim().toUpperCase(),
        postingSide: values.postingSide,
        isSystem: false,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit posting rule' : 'Create posting rule'}</DialogTitle>
          <DialogDescription>
            Map a source event component to the exact GL account, party policy and recognition
            method used while posting.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
            <FormSection title="Source mapping">
              <FormField
                control={form.control}
                name="sourceModule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source module</FormLabel>
                    <Select
                      value={field.value}
                      disabled={!!rule}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const allowedEventCodes = uniqueSorted(
                          rules
                            .filter((item) => item.sourceModule === value)
                            .map((item) => item.eventCode),
                        );
                        const currentEventCode = form.getValues('eventCode');
                        if (
                          allowedEventCodes.length > 0 &&
                          !allowedEventCodes.includes(currentEventCode)
                        ) {
                          form.setValue('eventCode', allowedEventCodes[0], {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceModuleOptions.map((sourceModule) => (
                          <SelectItem key={sourceModule} value={sourceModule}>
                            {sourceModule}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event code</FormLabel>
                    <Select value={field.value} disabled={!!rule} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventCodeOptions.map((eventCode) => (
                          <SelectItem key={eventCode} value={eventCode}>
                            {eventCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="componentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Component</FormLabel>
                    <Select value={field.value} disabled={!!rule} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select component" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {components.map((component) => (
                          <SelectItem key={component.code} value={component.code}>
                            {component.code} - {component.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postingSide"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posting side</FormLabel>
                    <Select value={field.value} disabled={!!rule} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select side" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moneyPostingSides.map((side) => (
                          <SelectItem key={side} value={side}>
                            {side}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Accounting rule">
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GL account</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GL account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(accounts.data ?? []).map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {accountLabel(account)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partyPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party policy</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select party policy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partyPolicyOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recognitionMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recognition</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recognition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recognitionMethodOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective from</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective to</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || accounts.isLoading}>
                {saving ? 'Saving...' : 'Save rule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getComponentDefaults(component: MoneyComponentType | null): ComponentFormValues {
  return {
    code: component?.code ?? '',
    label: component?.label ?? '',
    componentGroup: component?.componentGroup ?? 'OTHER',
    description: component?.description ?? '',
    gstApplicable: component?.gstApplicable ?? false,
    gstRatePercent: component?.gstRatePercent ?? '',
    hsnSacCode: component?.hsnSacCode ?? '',
    tdsApplicable: component?.tdsApplicable ?? false,
    tcsApplicable: component?.tcsApplicable ?? false,
    defaultAccountId: component?.defaultAccountId ?? null,
    defaultCostCenterId: component?.defaultCostCenterId ?? null,
    effectiveFrom: component?.effectiveFrom ?? todayIso(),
    effectiveTo: component?.effectiveTo ?? '',
    isActive: component?.isActive ?? true,
  };
}

function getPostingRuleDefaults(rule: MoneyPostingRule | null): PostingRuleFormValues {
  return {
    sourceModule: rule?.sourceModule ?? '',
    eventCode: rule?.eventCode ?? '',
    componentCode: rule?.componentCode ?? '',
    postingSide: rule?.postingSide ?? 'DEBIT',
    accountId: rule?.accountId ?? '',
    costCenterId: rule?.costCenterId ?? null,
    partyPolicy: (rule?.partyPolicy as (typeof partyPolicyOptions)[number]) ?? 'SOURCE',
    recognitionMethod:
      (rule?.recognitionMethod as (typeof recognitionMethodOptions)[number]) ?? 'IMMEDIATE',
    effectiveFrom: rule?.effectiveFrom ?? todayIso(),
    effectiveTo: rule?.effectiveTo ?? '',
    notes: rule?.notes ?? '',
    isActive: rule?.isActive ?? true,
  };
}
