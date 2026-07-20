export function AmountDisplay({ amount }: { amount: number | null | undefined }) {
    if (amount == null) return null;
    return <span>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}
