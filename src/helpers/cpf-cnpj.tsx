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

/** Formata CNPJs numéricos ou alfanuméricos enquanto o usuário digita. */
export function formatCnpjInput(value: string): string {
    const characters = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
    const base = characters.slice(0, 12);
    const checkDigits = characters.slice(12).replace(/\D/g, "").slice(0, 2);
    const cnpj = `${base}${checkDigits}`;

    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) {
        return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    }

    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

/** Formata CPF até 11 caracteres e passa a formatar CNPJ a partir do 12º. */
export function formatCpfCnpjInput(value: string): string {
    const characters = value.toUpperCase().replace(/[^0-9A-Z]/g, "");

    if (characters.length <= 11) {
        return formatCpfInput(characters.replace(/\D/g, ""));
    }

    return formatCnpjInput(characters);
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
