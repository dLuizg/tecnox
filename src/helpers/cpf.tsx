/** Formata os dígitos de um CPF enquanto o usuário digita. */
export function formatCpfInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Verifica se um CPF completo possui dígitos verificadores válidos. */
export function isValidCpf(value: string): boolean {
    const digits = value.replace(/\D/g, "");

    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    const calculateCheckDigit = (sequence: string): number => {
        const sum = [...sequence].reduce(
            (total, digit, index) => total + Number(digit) * (sequence.length + 1 - index),
            0,
        );
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstDigit = calculateCheckDigit(digits.slice(0, 9));
    const secondDigit = calculateCheckDigit(`${digits.slice(0, 9)}${firstDigit}`);

    return digits[9] === String(firstDigit) && digits[10] === String(secondDigit);
}
