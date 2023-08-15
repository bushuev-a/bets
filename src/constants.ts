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
