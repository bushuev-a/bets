import { type Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('battle_results', table => {
    table.increments('id').primary()
    table.integer('corp_id').notNullable()
    table.boolean('is_def').notNullable()
    table.integer('stock_cost').notNullable()
    table.integer('round_for_corp_id')
    table.integer('def_odd')
    table.integer('score').notNullable()
    table.date('battle_date').notNullable()
    table.integer('battle_hour').notNullable()
    table.datetime('created_at').defaultTo(knex.fn.now()).notNullable()

    table.unique(['corp_id', 'battle_date', 'battle_hour'])
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('battle_results')
}
