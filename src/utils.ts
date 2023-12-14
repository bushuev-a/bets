import { type MyContext } from '@/types'
import { DB_INFINITY, keyboard } from '@/constants'
import { prisma } from '@/db'

const intlNum = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const intlNumWithPlus = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2, signDisplay: 'exceptZero' })
const intlPluralRules = new Intl.PluralRules('ru-RU')

export const f = (num: number, showPlus: boolean = false): string => (showPlus ? intlNumWithPlus : intlNum).format(num)

const getScoreWord = (num: number): string => {
  const form = intlPluralRules.select(num)
  switch (form) {
    case 'one': return 'очко'
    case 'few': return 'очка'
    default: return 'очков'
  }
}

export const fScoreRange = (min: number, max: number): string => {
  const scoreWord = getScoreWord(max === DB_INFINITY ? min : max)

  if (min === max) {
    return `ровно ${f(min)} 🏆 ${scoreWord}`
  }
  if (min === 0) {
    return `меньше чем ${f(max)} 🏆 ${scoreWord}`
  }
  if (max === DB_INFINITY) {
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
  if (max === DB_INFINITY) {
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

export const cancelHandler = async (ctx: MyContext): Promise<void> => {
  await ctx.conversation.exit()
  await deleteMessages(ctx, ctx.session.deleteOnCancel)
  ctx.session.deleteOnCancel = []
  await ctx.reply('Что дальше?', {
    reply_markup: keyboard
  })
}

export const checkBalance = async (userId: number, num: number): Promise<boolean> => {
  const result = await prisma.transaction.aggregate({
    _sum: {
      amount: true
    },
    where: { userId }
  })
  if (result._sum.amount == null) {
    return false
  }
  return result._sum.amount.greaterThanOrEqualTo(num)
}
