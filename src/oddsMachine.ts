// TODO: somehow split this functions and write tests
import _ from 'lodash'
import { type BattleCorpResult, type RangedOdd, type WeightedScore } from '@/types'
import { COMMISSION, NEW_BATTLE_THRESHOLD, WEIGHTS } from '@/constants'

export const findPercentile = (sortedResults: WeightedScore[], percentile: number): number => {
  const totalWeight = _.sumBy(sortedResults, 'weight')
  const threshold = totalWeight * (percentile / 100)
  let cumulativeWeight = 0
  // function in find not entirely pure idk is it ok
  return sortedResults.find((result) => {
    cumulativeWeight += result.weight
    return cumulativeWeight >= threshold
  })?.score ?? 0
}

export const calculateOdds = (battleResults: BattleCorpResult[], nextBattleHour?: number): Record<string, RangedOdd[]> => {
  const weightedResults = _.chain(battleResults)
    .groupBy('corpId')
    .mapValues((results) => (
      results.map((result, i) => {
        let weight = WEIGHTS.base
        if (i < NEW_BATTLE_THRESHOLD) {
          weight += WEIGHTS.newBattle
        }
        if (result.hour === nextBattleHour) {
          weight += WEIGHTS.sameHour
        }
        return { ...result, weight }
      })
    ))
    .mapValues((results) => {
      const sortedResults = _.sortBy(results, 'score')
      const percentile10 = findPercentile(sortedResults, 10)
      const currentRage = _.chain(results)
        .take(10)
        .reduceRight((acc, result) => result.score <= percentile10 ? acc + 1 : 0, 0)
        .value()
      let rage = 0
      // this thing is not pure at all
      return _.chain(results)
        .reverse()
        .map((result) => {
          let weight = result.weight
          if (rage === currentRage) {
            weight += WEIGHTS.rage
          }
          if (result.score <= percentile10) {
            rage += 1
          } else {
            rage = 0
          }
          return { ...result, weight }
        }).value()
    })
    .value()

  // console.log(weightedResults)
  return _.chain(weightedResults)
    .mapValues((results): RangedOdd[] => {
      const sortedResults = _.sortBy(results, 'score')
      const totalWeight = _.sumBy(results, 'weight')

      const percentile25 = findPercentile(sortedResults, 25)
      const percentile50 = findPercentile(sortedResults, 50)
      const percentile75 = findPercentile(sortedResults, 75)

      const rangeOdd = (from: number, to: number): number => Math.min(1 / (_.chain(results)
        .filter((result) => result.score >= from && result.score <= to)
        .sumBy('weight')
        .value() / totalWeight + COMMISSION), 30)

      return [
        { min: 0, max: 0 },
        { min: 0, max: percentile25 },
        { min: 0, max: percentile50 },
        { min: percentile25 + 1, max: percentile50 },
        { min: percentile50 + 1, max: percentile75 },
        { min: percentile50 + 1, max: Infinity },
        { min: percentile75 + 1, max: Infinity }
      ].map((range) => ({
        ...range,
        odd: rangeOdd(range.min, range.max)
      }))
    })
    .value()
}
