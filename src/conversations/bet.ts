import { type MyContext, type MyConversation } from '@/types'
import { corpsName } from '@/constants'
import { deleteMessages, f, fScoreRange, sleep } from '@/utils'
import { InlineKeyboard, Keyboard } from 'grammy'
import { XXHash3 } from 'xxhash-addon'
import { parseUserNumber } from '@/parsers'

export async function betConversation (conversation: MyConversation, ctx: MyContext): Promise<void> {
  if (ctx.msg == null || ctx.match == null) {
    return
  }
  const [, corpId, iStr] = ctx.match
  const i = Number(iStr)
  const range = await conversation.external(() => ctx.cache.odds?.[corpId]?.[i])
  if (range == null) {
    await ctx.reply('Ставка не найдена.')
    return
  }
  const deleteOnSuccess = []
  conversation.session.deleteOnCancel.push(ctx.msg.message_id)
  const corpName = corpsName[corpId]
  const text = `
Ставим на то, что ${corpName} наберёт ${fScoreRange(range.min, range.max)}.
Коэф: ${f(range.odd)}.`
  let msg = await ctx.reply(`${text}\n\nСумма ставки?`, {
    reply_markup: new Keyboard().add('Отмена').resized()
  })
  conversation.session.deleteOnCancel.push(msg.message_id)

  let sum = 0
  while (true) {
    const newCtx = await conversation.waitFor(['message:text', 'callback_query:data'])
    if (newCtx.callbackQuery != null) {
      // parses cb query data with format bet_confirm_{8 byte hex hash}
      const [, hash] = /^bet_confirm_([0-9a-f]{16})$/.exec(newCtx.callbackQuery.data) ?? []
      if (hash == null || sum === 0) {
        continue
      }
      conversation.session.deleteOnCancel = []
      await newCtx.answerCallbackQuery()
      const newRange = await conversation.external(() => newCtx.cache.odds?.[corpId]?.[i] ?? {})
      const newHash = XXHash3.hash(Buffer.from(JSON.stringify({ ...newRange, sum }))).toString('hex')
      if (hash !== newHash) {
        await ctx.reply('Что-то пошло не так. Попробуйте сделать ставку ещё раз.')
        break
      }
      console.log(range, sum)
      await newCtx.editMessageText(`${text}
Сумма ставки: ${f(sum)}.
Возможный выигрыш ${f(range.odd * sum)}.

✅Ставка принята!`)
      await deleteMessages(ctx, deleteOnSuccess)
      const sleepTime = 1_000 - deleteOnSuccess.length * 200
      if (sleepTime > 0) {
        await sleep(sleepTime)
      }
      await ctx.reply('Что дальше?', {
        reply_markup: {
          remove_keyboard: true
        }
      })
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
    sum = num
    const hash = XXHash3.hash(Buffer.from(JSON.stringify({ ...range, sum }))).toString('hex')
    msg = await ctx.reply(
      `${text}
Сумма ставки: ${f(sum)}.
Возможный выигрыш ${f(range.odd * sum)}.

Нажмите на кнопку для подтверждения или введите сумму ещё раз.`,
      {
        reply_markup: new InlineKeyboard().text('Ставлю!', `bet_confirm_${hash}`)
      })
    conversation.session.deleteOnCancel.push(msg.message_id)
  }
}
