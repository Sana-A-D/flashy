export const currencyToCents = (amountStr: string): number => {
  if (!amountStr) return 0;
  // Handle empty or invalid formats gracefully
  const parsed = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

export const centsToCurrency = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2);
};
