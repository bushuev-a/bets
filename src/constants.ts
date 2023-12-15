import { Keyboard } from 'grammy'
import _ from 'lodash'

export const corpIds = {
  piper: 1,
  hooli: 2,
  stark: 3,
  umbrl: 4,
  wayne: 5,
  bmesa: 6
}

export const corpIdsByEmoji: Record<string, number> = {
  '📯': corpIds.piper,
  '🤖': corpIds.hooli,
  '⚡️': corpIds.stark,
  '☂️': corpIds.umbrl,
  '🎩': corpIds.wayne,
  '☣️': corpIds.bmesa
}
export const corpsEmoji: Record<string, string> = {
  [corpIds.piper]: '📯',
  [corpIds.hooli]: '🤖',
  [corpIds.stark]: '⚡️',
  [corpIds.umbrl]: '☂️',
  [corpIds.wayne]: '🎩',
  [corpIds.bmesa]: '☣️'
}
export const corpsName: Record<string, string> = {
  [corpIds.piper]: '📯Pied Piper',
  [corpIds.hooli]: '🤖Hooli',
  [corpIds.stark]: '⚡️Stark Ind.',
  [corpIds.umbrl]: '☂️Umbrella',
  [corpIds.wayne]: '🎩Wayne Ent.',
  [corpIds.bmesa]: '☣️Black Mesa'
}

export const keyboardTexts = {
  balance: 'Баланс',
  bet: 'Сделать ставку',
  deposit: 'Пополнить баланс',
  withdraw: 'Вывод',
  top: 'Топ',
  history: 'История'
}

export const keyboard = new Keyboard(
  _.chain(keyboardTexts)
    .values()
    .map(text => ({ text }))
    .chunk(2)
    .value()
).resized()

export const cancelKeyboard = new Keyboard().add('Отмена').resized()

export const isDefByEmoji: Record<string, boolean> = {
  '⚔': false,
  '🛡': true
}

export const COMMISSION = 0.03 // 3%
export const NEW_BATTLE_THRESHOLD = 15
export const OLD_BATTLE_THRESHOLD = 15
export const WEIGHTS = {
  base: 1,
  oldBattle: -0.5,
  newBattle: 0.5,
  rage: 0.4,
  sameHour: 0.2
}

export const DB_INFINITY = 322_000
