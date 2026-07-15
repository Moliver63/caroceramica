export function validarCPF(valor: string): boolean {
  const cpf = valor.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  // Rejeita sequências de dígito repetido (111.111.111-11 etc.) — passam
  // no cálculo do dígito verificador, mas nunca são CPFs reais.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  function calcularDigito(base: string, pesoInicial: number): number {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const digito1 = calcularDigito(cpf.slice(0, 9), 10);
  if (digito1 !== Number(cpf[9])) return false;

  const digito2 = calcularDigito(cpf.slice(0, 10), 11);
  if (digito2 !== Number(cpf[10])) return false;

  return true;
}

export function validarCNPJ(valor: string): boolean {
  const cnpj = valor.replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  function calcularDigito(base: string): number {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base
      .split("")
      .reduce((acc, digito, i) => acc + Number(digito) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const digito1 = calcularDigito(cnpj.slice(0, 12));
  if (digito1 !== Number(cnpj[12])) return false;

  const digito2 = calcularDigito(cnpj.slice(0, 13));
  if (digito2 !== Number(cnpj[13])) return false;

  return true;
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos), conforme o tamanho informado. */
export function validarDocumento(valor: string): boolean {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11) return validarCPF(digitos);
  if (digitos.length === 14) return validarCNPJ(digitos);
  return false;
}

export function formatarCPF(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCNPJ(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Formata como CPF enquanto tiver até 11 dígitos, CNPJ a partir do 12º. */
export function formatarDocumento(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length > 11 ? formatarCNPJ(digitos) : formatarCPF(digitos);
}
