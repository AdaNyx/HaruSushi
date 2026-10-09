const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const df = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

export function money(v) {
  return nf.format(Number(v || 0)) + ' $'
}

export function signedMoney(v) {
  const n = Number(v || 0)
  return (n > 0 ? '+' : '') + money(n)
}

export function num(v) {
  return nf.format(Number(v || 0))
}

export function date(v) {
  return df.format(new Date(v))
}
