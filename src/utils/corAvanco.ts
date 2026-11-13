/**
 * Cor de uma barra de avanço físico, interpolada em degradê:
 * 0% → vermelho da marca (#c8102e), ~50% → amarelo (#f5c518), 100% → verde (#1a9c4b).
 */
export function corAvanco(avanco: number): string {
  const p = Math.min(100, Math.max(0, avanco)) / 100
  const hex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')

  const vermelho = [200, 16, 46] // #c8102e
  const amarelo = [245, 197, 24] // #f5c518
  const verde = [26, 156, 75] // #1a9c4b

  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)

  const [r, g, b] = p <= 0.5 ? mix(vermelho, amarelo, p * 2) : mix(amarelo, verde, (p - 0.5) * 2)
  return `#${hex(r)}${hex(g)}${hex(b)}`
}
