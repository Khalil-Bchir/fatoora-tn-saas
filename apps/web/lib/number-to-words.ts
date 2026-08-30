/**
 * Utility to convert numbers to French words formatted for Tunisian Dinars (TND)
 * e.g., 2000.000 -> "Deux mille dinars tunisiens"
 */

const UNITS = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
]

const TENS = [
  '',
  'dix',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
  'soixante-dix',
  'quatre-vingts',
  'quatre-vingt-dix',
]

function convertUnderThousand(num: number): string {
  if (num === 0) return ''
  if (num < 20) return UNITS[num]!

  const ten = Math.floor(num / 10)
  const unit = num % 10

  if (ten === 7) {
    return 'soixante-' + (unit === 1 ? 'et-onze' : UNITS[10 + unit])
  }
  if (ten === 8) {
    return unit === 0 ? 'quatre-vingts' : 'quatre-vingt-' + UNITS[unit]
  }
  if (ten === 9) {
    return 'quatre-vingt-' + UNITS[10 + unit]
  }

  return TENS[ten] + (unit === 1 ? '-et-un' : unit > 0 ? '-' + UNITS[unit] : '')
}

function convertIntegerToWords(num: number): string {
  if (num === 0) return 'zéro'

  let words = ''

  const millions = Math.floor(num / 1000000)
  const thousands = Math.floor((num % 1000000) / 1000)
  const hundreds = Math.floor((num % 1000) / 100)
  const remainder = num % 100

  if (millions > 0) {
    words +=
      millions === 1
        ? 'un million '
        : `${convertIntegerToWords(millions)} millions `
  }

  if (thousands > 0) {
    if (thousands === 1) {
      words += 'mille '
    } else {
      words += `${convertIntegerToWords(thousands)} mille `
    }
  }

  if (hundreds > 0) {
    if (hundreds === 1) {
      words += 'cent '
    } else {
      words += `${UNITS[hundreds]} cent${remainder === 0 ? 's' : ''} `
    }
  }

  if (remainder > 0) {
    words += convertUnderThousand(remainder)
  }

  return words.trim()
}

export function numberToTunisianDinars(amount: number): string {
  if (!amount || isNaN(amount)) return 'Zéro dinar tunisien'

  const absAmount = Math.abs(amount)
  const dinars = Math.floor(absAmount)
  const millimes = Math.round((absAmount - dinars) * 1000)

  let result = convertIntegerToWords(dinars)
  result = result.charAt(0).toUpperCase() + result.slice(1)
  result += dinars > 1 ? ' dinars tunisiens' : ' dinar tunisien'

  if (millimes > 0) {
    result += ` et ${convertIntegerToWords(millimes)} millimes`
  }

  return result
}
