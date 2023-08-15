import { type MyContext } from '@/types'

const intlNum = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const intlPluralRules = new Intl.PluralRules('ru-RU')

export const f = (num: number): string => intlNum.format(num)

const getScoreWord = (num: number): string => {
  const form = intlPluralRules.select(num)
  switch (form) {
    case 'one': return 'очко'
    case 'few': return 'очка'
    default: return 'очков'
  }
}

export const fScoreRange = (min: number, max: number): string => {
  const scoreWord = getScoreWord(max === Infinity ? min : max)

  if (min === max) {
    return `ровно ${f(min)} 🏆 ${scoreWord}`
  }
  if (min === 0) {
    return `меньше чем ${f(max)} 🏆 ${scoreWord}`
  }
  if (max === Infinity) {
    return `больше чем ${f(min)} 🏆 ${scoreWord}`
  }
  return `от ${f(min)} до ${f(max)} 🏆 ${scoreWord}`
}

export const fRange = (min: number, max: number): string => {
  if (min === max) {
    return `ровно ${f(min)}`
  }
  if (min === 0) {
    return `меньше ${f(max)}`
  }
  if (max === Infinity) {
    return `больше ${f(min)}`
  }
  return `от ${f(min)} до ${f(max)}`
}

export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export const deleteMessages = async (ctx: MyContext, messageIds: number[]): Promise<void> => {
  for (const messageId of messageIds.reverse()) {
    try {
      await ctx.api.deleteMessage(ctx?.chat?.id ?? 0, messageId)
    } catch (e) {
      console.error(e)
    }
    await sleep(200)
  }
}
