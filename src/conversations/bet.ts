import { type MyContext, type MyConversation } from '../types'
import { cancelKeyboard, corpsName, keyboard } from '../constants'
import { checkBalance, deleteMessages, f, fScoreRange, sleep } from '../utils'
import { InlineKeyboard } from 'grammy'
// import { XXHash3 } from 'xxhash-addon'
import { parseUserNumber } from '../parsers'
import { Decimal } from '@prisma/client/runtime/library'
import { TransactionType } from '@prisma/client'
import { prisma } from '../db'
import { isPast } from 'date-fns'

export async function betConversation (conversation: MyConversation, ctx: MyContext): Promise<void> {
  if (ctx.msg == null || ctx.match == null) {
    return
  }
  const userId = ctx.from?.id
  if (userId == null) {
    return
  }
  const [, outcomeIdStr] = ctx.match
  const outcomeId = Number(outcomeIdStr)
  const outcome = await conversation.external(async () => {
    const result = await prisma.eventOutcome.findUnique({
      where: {
        id: outcomeId
      },
      select: {
        event: {
          select: {
            corpId: true,
            endTime: true
          }
        },
        odds: true,
        scoreMin: true,
        scoreMax: true
      }
    })
    if (result == null) {
      return null
    }
    return {
      ...result,
      odds: result.odds.toString()
    }
  })
  if (outcome == null) {
    await ctx.reply('Ставка не найдена.')
    return
  }
  if (isPast(outcome.event.endTime)) {
    await ctx.reply('Ставки на это событие больше не принимаются.')
    return
  }
  const odds = new Decimal(outcome.odds)
  const deleteOnSuccess = []
  conversation.session.deleteOnCancel.push(ctx.msg.message_id)
  const corpName = corpsName[outcome.event.corpId]
  const text = `
Ставим на то, что ${corpName} наберёт ${fScoreRange(outcome.scoreMin, outcome.scoreMax)}.
Коэф: ${f(odds.toNumber())}.`
  let msg = await ctx.reply(`${text}\n\nСумма ставки?`, {
    reply_markup: cancelKeyboard
  })
  conversation.session.deleteOnCancel.push(msg.message_id)

  let sum = 0
  while (true) {
    const newCtx = await conversation.waitFor(['message:text', 'callback_query:data'])
    if (newCtx.callbackQuery != null) {
      if (newCtx.callbackQuery.data !== 'bet_confirm' || sum === 0) {
        continue
      }
      const enoughMoney = await conversation.external(async () =>
        await checkBalance(ctx.from?.id ?? 0, sum)
      )
      if (!enoughMoney) {
        msg = await ctx.reply('Недостаточно средств.')
        deleteOnSuccess.push(msg.message_id)
        conversation.session.deleteOnCancel.push(msg.message_id)
        continue
      }
      if (isPast(outcome.event.endTime)) {
        await ctx.reply('Ставки на это событие больше не принимаются.', {
          reply_markup: { remove_keyboard: true }
        })
        return
      }
      await conversation.external(async () => await prisma.bet.create({
        data: {
          amount: sum,
          eventOutcome: {
            connect: {
              id: outcomeId
            }
          },
          user: {
            connect: {
              id: userId
            }
          },
          transaction: {
            create: {
              amount: -sum,
              userId,
              type: TransactionType.bet
            }
          }
        }
      }))
      conversation.session.deleteOnCancel = []
      await newCtx.answerCallbackQuery()
      await ctx.api.sendMessage(-1002110849593, `#id${userId} @${ctx.from?.username ?? ''}
${text}`)
      await newCtx.editMessageText(`${text}
Сумма ставки: ${f(sum)}.
Возможный выигрыш ${f(odds.mul(sum).toNumber())}.

✅Ставка принята!`)
      await deleteMessages(ctx, deleteOnSuccess)
      const sleepTime = 1_000 - deleteOnSuccess.length * 200
      if (sleepTime > 0) {
        await sleep(sleepTime)
      }
      await ctx.reply('Что дальше?', {
        reply_markup: keyboard
      })
      // parses cb query data with format bet_confirm_{8 byte hex hash}
      //       const [, hash] = /^bet_confirm_([0-9a-f]{16})$/.exec(newCtx.callbackQuery.data) ?? []
      //       if (hash == null || sum === 0) {
      //         continue
      //       }
      break
    }
    msg = newCtx.msg
    conversation.session.deleteOnCancel.push(msg.message_id)
    const num = parseUserNumber(msg.text)
    if (num == null || num === 0) {
      deleteOnSuccess.push(msg.message_id)
      msg = await ctx.reply('Введите сумму ставки или /cancel.')
      deleteOnSuccess.push(msg.message_id)
      conversation.session.deleteOnCancel.push(msg.message_id)
      continue
    }
    const enoughMoney = await conversation.external(async () =>
      await checkBalance(ctx.from?.id ?? 0, num)
    )
    if (!enoughMoney) {
      deleteOnSuccess.push(msg.message_id)
      msg = await ctx.reply('Недостаточно средств.')
      deleteOnSuccess.push(msg.message_id)
      conversation.session.deleteOnCancel.push(msg.message_id)
      continue
    }
    sum = num
    // const hash = XXHash3.hash(Buffer.from(JSON.stringify({ ...outcome, sum }))).toString('hex')
    msg = await ctx.reply(
      `${text}
Сумма ставки: ${f(sum)}.
Возможный выигрыш ${f(odds.mul(sum).toNumber())}.

Нажмите на кнопку для подтверждения или введите сумму ещё раз.`,
      {
        reply_markup: new InlineKeyboard().text('Ставлю!', 'bet_confirm')
      })
    conversation.session.deleteOnCancel.push(msg.message_id)
  }
}
