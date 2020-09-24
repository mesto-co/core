
exports.up = function(knex) {
  return knex.schema.createTable('Contact', function(table) {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('title').notNullable();
    table.string('url').notNullable();
    table.uuid('ownerId').notNullable();
    table.foreign('ownerId').references('User.id');
    table.timestamp('createdAt',{ useTz: false }).defaultTo(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('Contact');
};
