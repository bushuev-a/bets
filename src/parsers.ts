import { type ParsedBattleCorpResult } from '@/types'
import { corpIdsByEmoji, isDefByEmoji } from '@/constants'
import _ from 'lodash'

export const parseBattleResult = (text: string): ParsedBattleCorpResult[] => {
  const lines = text.split('\n\n')
  const scores = (lines.pop() ?? '').split('\n')
  scores.shift()
  const scoresTable = _.chain(scores).map(scoreStr => {
    const result = /^(?<corp>📯|🤖|⚡️|☂️|🎩|☣️).+ \+(?<score>[\d ]+) 🏆 очков$/.exec(scoreStr)
    if (result == null || result.groups == null) {
      return null
    }
    const { corp, score } = result.groups
    return [corpIdsByEmoji[corp], Number(score.replaceAll(' ', ''))]
  }).filter(x => x != null).fromPairs().value()
  return lines.map(line => {
    const result = /^(?<def>⚔|🛡).+ (?<corp>📯|🤖|⚡️|☂️|🎩|☣️).+\n(?:🏅Топ взломщики: .+\n)?(?:🏅Топ защитники: .+\n)?(?:(?<roundFor>📯|🤖|⚡️|☂️|🎩|☣️)Второй раунд: .+\n)?(?:💵У взломщиков отобрали \$[\d ]+ 💵\. \+ [\d ]+ 🏆 за защиту \((?<defOdd>[01]\.\d{2})➗\)\.|.+)\n(?:📈|📉)Акции компании (?<stockChange>упали|не изменились|выросли) в цене (?:—|до) \$(?<stockCost>\d+) 💵$/u.exec(line)
    if (result == null || result.groups == null) {
      return null
    }
    const { def, corp, stockCost, roundFor, defOdd } = result.groups
    const corpId = corpIdsByEmoji[corp]
    const corpResult: ParsedBattleCorpResult = {
      corpId,
      isDef: isDefByEmoji[def],
      stockCost: Number(stockCost),
      roundForCorp: corpIdsByEmoji[roundFor],
      defOdd: defOdd != null ? Number(defOdd.replace('.', '')) : undefined,
      score: scoresTable[corpId]
    }
    return corpResult
  }).filter((x): x is ParsedBattleCorpResult => x != null)
}

export const parseUserNumber = (text: string): number | null => {
  if (!/^[\d  ]+(?:[.,]\d+)?$/.test(text)) {
    return null
  }
  return Number(text
    .replaceAll(' ', '')
    .replaceAll(' ', '')
    .replace(',', '.')
  )
}
