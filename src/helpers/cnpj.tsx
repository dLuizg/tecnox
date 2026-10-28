/** Formata CNPJs numéricos ou alfanuméricos enquanto o usuário digita. */
export function formatCnpjInput(value: string): string {
    const characters = value.toUpperCase().replace(/[^0-9A-Z]/g, "");

    // A raiz e a ordem (12 posições) aceitam letras e números; os verificadores são numéricos.
    const base = characters.slice(0, 12);
    const checkDigits = characters.slice(12).replace(/\D/g, "").slice(0, 2);
    const cnpj = `${base}${checkDigits}`;

    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) {
        return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    }
    if (cnpj.length <= 12) {
        return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    }

    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}
