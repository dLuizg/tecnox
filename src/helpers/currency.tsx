
export function formatCurrencyInput(valor: string): string {
    const digitos = valor.replace(/\D/g, "");

    if (digitos === "") {
        return "0,00";
    }

    const centavos = Number(digitos);

    if (!Number.isFinite(centavos)) {
        return "0,00";
    }

    const formatador = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return formatador.format(centavos / 100);
}
