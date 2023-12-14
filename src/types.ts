import { type Context, type SessionFlavor } from 'grammy'
import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations'
import { type PrismaClient } from '@prisma/client'

export interface ParsedBattleCorpResult {
  isDef: boolean
  corpId: number
  stockCost: number
  roundForCorpId?: number
  defMultiplier?: number
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

export interface SessionData {
  deleteOnCancel: number[]
}

export type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>
export type MyConversation = Conversation<MyContext>
