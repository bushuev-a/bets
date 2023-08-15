import 'dotenv/config'
import _ from 'lodash'
import { Bot, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { knex } from 'knex'
import knexFile from '../knexfile'
import { parseBattleResult } from '@/parsers'
import type { BattleCache, BattleCorpResult, MyContext, SessionData } from '@/types'
import { calculateOdds } from '@/oddsMachine'
import { corpsName } from '@/constants'
import { deleteMessages, f, fRange } from '@/utils'
import { betConversation } from '@/conversations/bet'

process.env.TZ = 'Europe/Moscow'
const { BOT_TOKEN } = process.env
const cache: BattleCache = {}

const db = knex(knexFile)
const bot = new Bot<MyContext>(BOT_TOKEN ?? '')

bot.use(session({
  initial: (): SessionData => ({
    deleteOnCancel: []
  })
}))
bot.use(conversations())

bot.chatType('private').on(['message', 'callback_query'], async (ctx, next) => {
  await db('users').insert({
    id: ctx.from.id,
    name: ctx.from.first_name
  }).onConflict('id').merge()
  ctx.cache = cache
  await next()
})
bot.use(createConversation(betConversation))

const cancelHandler = async (ctx: MyContext): Promise<void> => {
  await ctx.conversation.exit()
  await deleteMessages(ctx, ctx.session.deleteOnCancel)
  ctx.session.deleteOnCancel = []
  await ctx.reply('Что дальше?', {
    reply_markup: {
      remove_keyboard: true
    }
  })
}

bot.command('cancel', cancelHandler)
bot.hears('Отмена', cancelHandler)

const fillCache = async (): Promise<void> => {
  const results: BattleCorpResult[] = await db.select('corp_id as corpId', 'score', 'battle_hour as hour')
    .from('battle_results')
    .orderBy('battle_date', 'desc')
    .orderBy('battle_hour', 'desc')
  cache.odds = calculateOdds(results)
}

bot.chatType('private').on('message:text').hears(/\n\nПо итогам битвы компаниям начислено:(?:\n.+){6}/, async ctx => {
  const parsedResults = parseBattleResult(ctx.msg.text)
  const forwardDate = new Date((ctx.msg.forward_date ?? ctx.msg.date) * 1_000)
  await db.insert(parsedResults.map(result => ({
    corp_id: result.corpId,
    is_def: result.isDef,
    stock_cost: result.stockCost,
    round_for_corp_id: result.roundForCorp,
    def_odd: result.defOdd,
    score: result.score,
    battle_date: forwardDate.toISOString().split('T')[0],
    battle_hour: forwardDate.getHours()
  }))).into('battle_results').catch(console.error)
  await fillCache()
  await ctx.reply('Сохранил!')
})

bot.chatType('private').hears(/\/b(\d+)_(\d+)/, async ctx => {
  await ctx.conversation.enter('betConversation')
})

bot.chatType('private').command('h', async ctx => {
  if (cache.odds == null) {
    await fillCache()
    await ctx.reply('Ставки сделаны, ставок больше нет.')
    return
  }
  const str = _.chain(cache.odds)
    .toPairs()
    .map(([corpId, ranges]) => {
      const corpName = corpsName[corpId]
      const rangesString = ranges.map((range, i) =>
        `${_.capitalize(fRange(range.min, range.max))}🏆 - ${f(range.odd)} /b${corpId}_${i}`
      ).join('\n\t')
      return `Сколько очков заработает ${corpName}?\n\t${rangesString}`
    }).join('\n\n')
    .value()

  await ctx.reply(str)
})
const main = async (): Promise<void> => {
  await bot.init()
  console.log(`Running as @${bot.botInfo.username}`)
  await bot.start({ drop_pending_updates: true })
}

main().catch(console.error)
