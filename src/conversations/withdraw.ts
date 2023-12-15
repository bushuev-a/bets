import type { MyContext, MyConversation } from '../types'
import { cancelKeyboard, keyboard } from '../constants'
import { prisma } from '../db'
import { TransactionType } from '@prisma/client'
import { checkBalance, f } from '../utils'

const FRIDAY_KEY = process.env.FRIDAY_KEY ?? ''
const MY_ID = Number(process.env.MY_ID)

export async function withdrawConversation (conversation: MyConversation, ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id
  if (userId == null) {
    return
  }

  while (true) {
    await ctx.reply('Введите сумму RR. Комиссия за вывод не взымается.', {
      reply_markup: cancelKeyboard
    })
    const number = await conversation.form.int(async ctx => {
      await ctx.reply('Введите сумму для пополнения или /cancel.')
    })
    if (number <= 0 || number > 5000) {
      continue
    }
    const amount = number * -1

    const canWithdraw = await checkBalance(userId, number)
    if (!canWithdraw) {
      continue
    }

    await prisma.transaction.create({
      data: {
        type: TransactionType.withdraw,
        amount,
        userId
      }
    })

    await fetch(`http://quotes.daurge.ru:8000/friday/${FRIDAY_KEY}/${MY_ID}/${userId}/rr_${amount}`, {
      method: 'GET'
    })
    await ctx.reply(`Списано ${f(number)} RR`, {
      reply_markup: keyboard
    })

    return
  }
}
