import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('events', table => {
    table.increments('id').primary()
    table.text('name').notNullable()
    table.datetime('created_at').defaultTo(knex.fn.now()).notNullable()
  })
  await knex.schema.createTable('event_outcomes', table => {
    table.increments('id').primary()
    table.integer('event_id').references('id').inTable('events').notNullable()
    table.string('name', 32).notNullable()
    table.integer('chance').notNullable() // TODO use decimal?
    table.integer('order').notNullable()
    table.datetime('created_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('event_outcomes')
  await knex.schema.dropTable('events')
}
