import { findPercentile } from '../oddsMachine'
import { type WeightedScore } from '../types'

describe('findPercentile', () => {
  it('returns the correct score for a given percentile', () => {
    const results: WeightedScore[] = [
      { weight: 2, score: 10 },
      { weight: 3, score: 20 },
      { weight: 5, score: 30 }
    ]

    expect(findPercentile(results, 20)).toBe(10) // The 20% of total weight (10) is 2, so first result's score is returned
    expect(findPercentile(results, 50)).toBe(20) // The 50% of total weight (10) is 5, so second result's score is returned
  })

  it('returns 0 for an empty array', () => {
    const results: WeightedScore[] = []

    expect(findPercentile(results, 50)).toBe(0)
  })

  it('handles edge cases', () => {
    const results: WeightedScore[] = [
      { weight: 2, score: 10 },
      { weight: 3, score: 20 },
      { weight: 5, score: 30 }
    ]

    expect(findPercentile(results, 0)).toBe(10) // It should return the first score for 0 percentile
    expect(findPercentile(results, 100)).toBe(30) // It should return the last score for 100 percentile
  })
})
