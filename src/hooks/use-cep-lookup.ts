"use client";

import { useEffect, useRef, useState } from "react";
import { getCepDigits } from "@/src/helpers/cep";

export type CepAddressResult = {
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

export type CepLookupStatus = "idle" | "loading" | "success" | "not-found" | "invalid" | "error";

export function useCepLookup() {
  const [status, setStatus] = useState<CepLookupStatus>("idle");
  const [message, setMessage] = useState("");
  const requestId = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => () => abortController.current?.abort(), []);

  async function lookupCep(value: string): Promise<CepAddressResult | null> {
    requestId.current += 1;
    const currentRequestId = requestId.current;
    abortController.current?.abort();
    abortController.current = null;
    setMessage("");

    const digits = getCepDigits(value);
    if (digits.length > 8) {
      setStatus("invalid");
      setMessage("O CEP deve conter exatamente 8 dígitos. Você pode preencher o endereço manualmente.");
      return null;
    }
    if (digits.length !== 8) {
      setStatus("idle");
      return null;
    }

    const controller = new AbortController();
    abortController.current = controller;
    setStatus("loading");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("cep-request-failed");
      const result = await response.json() as ViaCepResponse;

      if (requestId.current !== currentRequestId) return null;
      if (result.erro === true || result.erro === "true") {
        setStatus("not-found");
        setMessage("CEP não encontrado. Você pode preencher o endereço manualmente.");
        return null;
      }

      setStatus("success");
      setMessage("Endereço preenchido pelo CEP. Confira os dados e informe o número.");
      return {
        street: result.logradouro ?? "",
        complement: result.complemento ?? "",
        neighborhood: result.bairro ?? "",
        city: result.localidade ?? "",
        state: result.uf?.toUpperCase() ?? "",
      };
    } catch (error) {
      if (requestId.current !== currentRequestId || (error instanceof DOMException && error.name === "AbortError")) return null;
      setStatus("error");
      setMessage("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
      return null;
    }
  }

  return { lookupCep, status, message };
}
