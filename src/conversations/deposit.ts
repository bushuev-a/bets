import type { MyContext, MyConversation } from '../types'
import { cancelKeyboard, currency, keyboard } from '../constants'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../db'
import { TransactionType } from '@prisma/client'
import { f } from '../utils'

const FRIDAY_KEY = process.env.FRIDAY_KEY ?? ''
const MY_ID = Number(process.env.MY_ID)

export async function depositConversation (conversation: MyConversation, ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id
  if (userId == null) {
    return
  }

  while (true) {
    await ctx.reply('Введите сумму для пополнения. Комиссия за пополнение 2%.', {
      reply_markup: cancelKeyboard
    })
    const number = await conversation.form.int(async ctx => {
      await ctx.reply('Введите сумму для пополнения или /cancel.')
    })
    if (number <= 0) {
      continue
    }
    const amount = new Decimal(number).mul('0.98')
    const result = await fetch(`http://quotes.daurge.ru:8000/friday/${FRIDAY_KEY}/${MY_ID}/${userId}/rr_${number}`, {
      method: 'GET'
    }).then(async res => await res.json())
    if (result.status === false) {
      await ctx.reply('Недостаточно RR.')
      return
    }
    await prisma.transaction.create({
      data: {
        type: TransactionType.deposit,
        amount,
        userId
      }
    })
    await ctx.reply(`Зачислено ${f(amount.toNumber())} ${currency}`, {
      reply_markup: keyboard
    })
    return
  }
}
