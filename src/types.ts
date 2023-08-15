import { type Context, type SessionFlavor } from 'grammy'
import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations'

export interface ParsedBattleCorpResult {
  isDef: boolean
  corpId: number
  stockCost: number
  roundForCorp?: number
  defOdd?: number
  score: number
}

export interface RangedOdd {
  odd: number
  min: number
  max: number
}

interface HasScore {
  score: number
}

export interface BattleCorpResult extends HasScore {
  corpId: number
  hour: number
}

interface HasWeight {
  weight: number
}

export interface WeightedBattleCorpResult extends BattleCorpResult, HasWeight {}
export interface WeightedScore extends HasScore, HasWeight {}

export interface BattleCache {
  weightedResults?: Record<string, WeightedBattleCorpResult[]>
  odds?: Record<string, RangedOdd[]>
}

export interface SessionData {
  deleteOnCancel: number[]
}

export type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData> & { cache: BattleCache }
export type MyConversation = Conversation<MyContext>
