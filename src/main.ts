import 'dotenv/config'
import { Bot, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { parseBattleResult } from './parsers'
import type { MyContext, SessionData } from './types'
import { cancelHandler, f, fRange } from './utils'
import { betConversation } from './conversations/bet'
import { BetStatus } from '@prisma/client'
import _ from 'lodash'
import { corpsName, currency, DB_INFINITY, keyboard, keyboardTexts } from './constants'
import { calculateOdds } from './oddsMachine'
import { fromUnixTime, set, addMinutes, isPast, addHours, subMinutes } from 'date-fns'
import { prisma } from './db'
import { depositConversation } from './conversations/deposit'
import { withdrawConversation } from './conversations/withdraw'

process.env.TZ = 'Europe/Moscow'
const { BOT_TOKEN } = process.env

const bot = new Bot<MyContext>(BOT_TOKEN ?? '')

bot.use(session({
  initial: (): SessionData => ({
    deleteOnCancel: []
  })
}))
bot.use(conversations())

bot.chatType('private').on(['message', 'callback_query'], async (ctx, next) => {
  const { id, first_name: name, username } = ctx.from
  const data = {
    id,
    username,
    name
  }
  await prisma.user.upsert({
    where: {
      id
    },
    create: data,
    update: data
  })
  await next()
})

bot.chatType('private').command('cancel', cancelHandler)
bot.chatType('private').hears('Отмена', cancelHandler)

bot.use(createConversation(betConversation))
bot.use(createConversation(depositConversation))
bot.use(createConversation(withdrawConversation))

bot.chatType('private').command('start', async ctx => {
  await ctx.reply('Привет! Я бот букмекер компании Stark Ind.', {
    reply_markup: keyboard
  })
})

bot.chatType('private').hears(keyboardTexts.deposit, async ctx => {
  await ctx.conversation.enter('depositConversation')
})

bot.chatType('private').hears(keyboardTexts.withdraw, async ctx => {
  await ctx.conversation.enter('withdrawConversation')
})

bot.chatType('private').hears(keyboardTexts.balance, async ctx => {
  const { _sum: { amount } } = await prisma.transaction.aggregate({
    _sum: {
      amount: true
    },
    where: {
      userId: ctx.from.id
    }
  })
  await ctx.reply(`У вас ${f(amount == null ? 0 : amount.toNumber())} 🚀`)
})

bot.chatType('private').on('message:text').hears(/\n\nПо итогам битвы компаниям начислено:(?:\n.+){6}/, async ctx => {
  const unixTime = ctx?.msg?.forward_date
  if (unixTime == null) {
    return
  }
  const time = set(addMinutes(fromUnixTime(unixTime), 1), {
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  })
  const parsedResults = parseBattleResult(ctx.msg.text)
  try {
    await prisma.battle.create({
      select: { id: true },
      data: {
        time,
        results: {
          createMany: {
            data: parsedResults
          }
        }
      }
    })
  } catch {
    await ctx.reply('Уже видел.')
    return
  }

  const nextTime = addHours(time, time.getHours() === 22 ? 12 : 3)

  const pendingBets = await prisma.bet.findMany({
    where: {
      status: 'pending'
    },
    include: {
      eventOutcome: {
        include: {
          event: true
        }
      },
      transaction: true
    }
  })

  for (const bet of pendingBets) {
    const { eventOutcome } = bet
    const { corpId } = eventOutcome.event

    const battleResult = parsedResults.find((result) => result.corpId === corpId)
    if (battleResult == null) {
      continue
    }
    const isWon = battleResult.score >= eventOutcome.scoreMin && battleResult.score <= eventOutcome.scoreMax
    const updatedStatus = isWon ? BetStatus.won : BetStatus.lost

    await prisma.bet.update({
      where: { id: bet.id },
      data: { status: updatedStatus }
    })

    if (isWon) {
      await prisma.transaction.update({
        where: {
          id: bet.transaction.id
        },
        data: {
          amount: bet.amount.mul(eventOutcome.odds.minus(1))
        }
      })
    }

    await ctx.api.sendMessage(Number(bet.userId), isWon ? 'Твоя ставка зашла' : 'Ты проиграл').catch(console.error)
  }

  if (isPast(nextTime)) {
    return
  }

  const results = await prisma.battleResult.findMany({
    select: {
      score: true,
      corpId: true,
      battle: {
        select: {
          time: true
        }
      }
    },
    orderBy: {
      battle: {
        time: 'desc'
      }
    }
  })
  const odds = calculateOdds(results.map(({ corpId, battle, score }) => ({
    corpId,
    score,
    hour: battle.time.getHours()
  })))
  const promises = Object.entries(odds).map(async ([corpId, ranges]) => (
    await prisma.event.create({
      data: {
        name: '',
        corpId: Number(corpId),
        startTime: new Date(),
        endTime: subMinutes(nextTime, 10),
        outcomes: {
          createMany: {
            data: ranges.map(({ min, max, odd }) => ({
              odds: odd,
              scoreMin: min,
              scoreMax: max === Infinity ? DB_INFINITY : max
            }))
          }
        }
      }
    })))
  await Promise.all(promises)
  await ctx.reply('Done!')
})

bot.chatType('private').hears(/^\/b(\d+)$/, async ctx => {
  await ctx.conversation.enter('betConversation')
})

bot.chatType('private').hears(keyboardTexts.bet, async ctx => {
  const events = await prisma.event.findMany({
    where: {
      endTime: {
        gt: new Date()
      }
    },
    select: {
      corpId: true,
      outcomes: {
        select: {
          id: true,
          scoreMin: true,
          scoreMax: true,
          odds: true
        }
      }
    },
    orderBy: {
      corpId: 'asc'
    }
  })
  if (events.length === 0) {
    await ctx.reply('Ставки сделаны, ставок больше нет.')
    return
  }
  const str = _.chain(events)
    .map(({ corpId, outcomes }) => {
      const corpName = corpsName[corpId]
      const outcomesString = outcomes.map((outcome) =>
        `${_.capitalize(fRange(outcome.scoreMin, outcome.scoreMax))}🏆 - ${f(outcome.odds.toNumber())} /b${outcome.id}`
      ).join('\n\t')
      return `Сколько очков заработает ${corpName}?\n\t${outcomesString}`
    }).join('\n\n')
    .value()

  await ctx.reply(str)
})

bot.chatType('private').hears(keyboardTexts.history, async ctx => {
  const userTransactions = await prisma.transaction.findMany({
    where: {
      userId: ctx.from.id
    },
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      relatedBet: true
    }
  })
  if (userTransactions == null) {
    return
  }
  const history = userTransactions.map(trx => {
    let emoji = '⏳'
    if (trx.type === 'deposit') {
      emoji = '➕'
    } else if (trx.type === 'withdraw') {
      emoji = '➖'
    } else if (trx.relatedBet != null) {
      if (trx.relatedBet.status === BetStatus.won) {
        emoji = '✅'
      } else if (trx.relatedBet.status === BetStatus.lost) {
        emoji = '❌'
      }
    }
    const ammount = trx.amount.toNumber()
    return `${emoji} ${f(ammount, true)}`
  }).join('\n')
  await ctx.reply(`История:

${history}`)
})

bot.hears(keyboardTexts.top, async ctx => {
  const betsSum = await prisma.transaction.groupBy({
    by: 'userId',
    where: {
      relatedBet: {
        status: {
          not: 'pending'
        }
      }
    },
    _sum: {
      amount: true
    },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10
  })

  const userIds = betsSum.map(entry => entry.userId)
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    }
  })

  const top = betsSum.map((entry, i) => {
    const user = users.find(u => u.id === entry.userId)
    const amount = entry._sum?.amount?.toNumber?.()
    if (user == null || amount == null) {
      return null
    }
    return `${i + 1}. ${user.name} - ${f(amount, true)}${currency}`
  }).filter(Boolean).join('\n')
  await ctx.reply(`Топ победителей:

${top}`)
})

bot.catch(({ error }) => {
  console.error(error)
})

const main = async (): Promise<void> => {
  await prisma.$connect()
  await bot.init()
  console.log(`Running as @${bot.botInfo.username}`)
  await bot.start({ drop_pending_updates: true })
}

main().catch(console.error)
