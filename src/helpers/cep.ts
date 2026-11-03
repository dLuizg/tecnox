/** Formats an eight-digit Brazilian postal code as 00000-000. */
export function formatCepInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function getCepDigits(value: string): string {
  return value.replace(/\D/g, "");
}
