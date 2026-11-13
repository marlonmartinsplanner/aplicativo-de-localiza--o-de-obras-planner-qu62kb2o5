/** Domínio corporativo único aceito no login/cadastro/recuperação de senha. */
export const DOMINIO_CORPORATIVO = '@construtoraplanner.com.br'

export function isEmailCorporativo(email: string): boolean {
  return email.trim().toLowerCase().endsWith(DOMINIO_CORPORATIVO)
}

export const MSG_EMAIL_CORPORATIVO = 'Use seu e-mail corporativo (@construtoraplanner.com.br)'
