import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('users', table => {
    table.bigint('id').primary().unique().notNullable()
    table.string('name', 64)
    table.datetime('created_at').defaultTo(knex.fn.now()).notNullable()
    table.datetime('updated_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}
