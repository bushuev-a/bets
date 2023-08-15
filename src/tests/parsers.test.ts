import { parseBattleResult, parseUserNumber } from '@/parsers'
import { type ParsedBattleCorpResult } from '@/types'
import { corpIds } from '@/constants'

describe('parseBattleResult', () => {
  // TODO: more testcases (?)
  it('should parse battle results right', () => {
    const text = `⚔Взлом 📯Pied Piper удался атакующим практически без труда, защита была намного слабее.
🏅Топ взломщики: ☂️[PA] Tanika (66), ☂️[PA] Dranduletty (67), ☂️🌊[RE] Bosk (56), ☂️[PA] AI (59)
☂️Второй раунд: ☂️Umbrella
💵У компании утащили $222 969 + $311 293💵
📈Акции компании выросли в цене до $22 💵

🛡Защитники 🤖Hooli не почувствовали атаки, легко отбив нападение.
🏅Топ взломщики: ☣️🖤ЛАКИ КОМ (62), ☣️[ST] Loner-Apyley (46)
🏅Топ защитники: 🤖[AH] RedOrange (65), 🤖[AH] ОР ЛОНДО (64), 🤖[AH] ИМЕ (63), 🤖[AH] КАКАО (61)
💵У взломщиков отобрали $490 💵. + 9 591 🏆 за защиту (0.70➗).
📈Акции компании не изменились в цене — $100 💵

⚔Взлом ⚡️Stark Ind. удался атакующим практически без труда, защита была намного слабее.
🏅Топ взломщики: ☣️[SU] gar daddy (64), ☣️[ST] Defeat (67), 📯[ED] Psihopat (66), ☣️[ST] XPbl4 (61)
🏅Топ защитники: ⚡️[GG] AVE BUBBLE (46)
🎩Второй раунд: 🎩Wayne Ent.
💵У компании утащили $383 816 + $554 021💵
📈Акции компании не изменились в цене — $56 💵

🛡Бой за ☂️Umbrella выдался крайне тяжёлым, но защитники смогли переломить ход битвы и победить.
🏅Топ взломщики: 🤖[HZ] Толпыз (68), 🤖[HZ] добряк (59), 🤖[HZ] Petya (67), 🤖Горящая Стрела (62)
🏅Топ защитники: ☂️🌞[PA] Д (61), ☂️[FS] miracle (63), ☂️🍋[PA] NIC (62), ☂️[PA] Cardinal (64)
💵У взломщиков отобрали $29 044 💵. + 11 876 🏆 за защиту (1.30➗).
📈Акции компании не изменились в цене — $51 💵

⚔Взлом 🎩Wayne Ent. удался атакующим практически без труда, защита была намного слабее.
🏅Топ взломщики: 📯[ED] Aki (58), ☣️[SU] Fast (45), 📯Q (60), 🤖[AH] ТАГОНИСТ (60)
🏅Топ защитники: 🎩Дикая Охота (38), 🎩PanDoraRom (38), 🎩Рыцарь смерти (37), 🎩Chris Rock (37)
📯Второй раунд: 📯Pied Piper
💵У компании утащили $202 997 + $344 316💵
📈Акции компании не изменились в цене — $31 💵

⚔Взлом ☣️Black Mesa удался атакующим практически без труда, защита была намного слабее.
🏅Топ взломщики: ⚡️[RR] рофлокодер (62), ⚡️🌝[RR] Бубле с др (67), ⚡️Witch (55), ⚡️[RR] F0len (63)
🏅Топ защитники: ☣️nkomp512 (44)
⚡️Второй раунд: ⚡️Stark Ind.
💵У компании утащили $256 649 + $422 312💵
📈Акции компании не изменились в цене — $3 💵

По итогам битвы компаниям начислено:
☂️Umbrella +16 458 🏆 очков
🤖Hooli +10 016 🏆 очков
⚡️Stark Ind. +8 540 🏆 очков
📯Pied Piper +6 302 🏆 очков
☣️Black Mesa +5 565 🏆 очков
🎩Wayne Ent. +3 136 🏆 очков`
    const results: ParsedBattleCorpResult[] = [
      {
        corpId: corpIds.piper,
        isDef: false,
        stockCost: 22,
        roundForCorp: corpIds.umbrl,
        defOdd: undefined,
        score: 6_302
      },
      {
        corpId: corpIds.hooli,
        isDef: true,
        stockCost: 100,
        roundForCorp: undefined,
        defOdd: 70,
        score: 10_016
      },
      {
        corpId: corpIds.stark,
        isDef: false,
        stockCost: 56,
        roundForCorp: corpIds.wayne,
        defOdd: undefined,
        score: 8_540
      },
      {
        corpId: corpIds.umbrl,
        isDef: true,
        stockCost: 51,
        roundForCorp: undefined,
        defOdd: 130,
        score: 16_458
      },
      {
        corpId: corpIds.wayne,
        isDef: false,
        stockCost: 31,
        roundForCorp: 1,
        defOdd: undefined,
        score: 3_136
      },
      {
        corpId: corpIds.bmesa,
        isDef: false,
        stockCost: 3,
        roundForCorp: corpIds.stark,
        defOdd: undefined,
        score: 5_565
      }
    ]

    expect(parseBattleResult(text)).toStrictEqual(results)
  })
})

describe('parseUserNumber', () => {
  it('should parse user number correctly', () => {
    expect(parseUserNumber('1')).toBe(1)
    expect(parseUserNumber('123')).toBe(123)
    expect(parseUserNumber('123.123')).toBe(123.123)
    expect(parseUserNumber('123 123')).toBe(123123)
    expect(parseUserNumber('123 123.123')).toBe(123123.123)
    expect(parseUserNumber('123 123,123')).toBe(123123.123)
    expect(parseUserNumber('123 123 123.123')).toBe(123123123.123)
  })

  it('should return null on invalid input', () => {
    expect(parseUserNumber('')).toBe(null)
    expect(parseUserNumber('.')).toBe(null)
    expect(parseUserNumber('abc')).toBe(null)
    expect(parseUserNumber('abc.123')).toBe(null)
    expect(parseUserNumber('abc 123')).toBe(null)
    expect(parseUserNumber('abc 123.123')).toBe(null)
    expect(parseUserNumber('abc 123,123')).toBe(null)
    expect(parseUserNumber('abc 123 123.123')).toBe(null)
  })
})
