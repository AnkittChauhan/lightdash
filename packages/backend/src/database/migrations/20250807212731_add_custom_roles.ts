import { Knex } from 'knex';

const RolesTableName = 'roles';
const ScopedRolesTableName = 'scoped_roles';
const OrganizationMembershipsTableName = 'organization_memberships';
const ProjectMembershipsTableName = 'project_memberships';

export async function up(knex: Knex): Promise<void> {
    // Create roles table
    await knex.schema.createTable(RolesTableName, (rolesTable) => {
        rolesTable
            .uuid('role_uuid')
            .primary()
            .defaultTo(knex.raw('uuid_generate_v4()'));
        rolesTable.string('name').notNullable();
        rolesTable.text('description').nullable();
        rolesTable
            .uuid('organization_uuid')
            .notNullable()
            .references('organization_uuid')
            .inTable('organizations')
            .onDelete('CASCADE');
        // For backwards compatibility, we keep organization_id until we migrate
        // membership tables to use UUID references to org.
        // This field is used to power constraints on role assignments.
        rolesTable.integer('organization_id').notNullable();
        rolesTable
            .uuid('created_by')
            .nullable()
            .references('user_uuid')
            .inTable('users')
            .onDelete('SET NULL');
        rolesTable.string('type').notNullable().defaultTo('user');
        rolesTable.timestamp('created_at').defaultTo(knex.fn.now());
        rolesTable.timestamp('updated_at').defaultTo(knex.fn.now());

        rolesTable.unique(['name', 'organization_uuid']);
        rolesTable.index('organization_uuid');
    });

    await Promise.all([
        knex.schema.alterTable(
            OrganizationMembershipsTableName,
            (orgMembershipTable) => {
                orgMembershipTable
                    .text('role')
                    .nullable()
                    .defaultTo('member')
                    .alter();
                orgMembershipTable
                    .uuid('role_uuid')
                    .references('role_uuid')
                    .inTable('roles')
                    // Prevent deleting a role if assigned to a user
                    .onDelete('RESTRICT');
            },
        ),
        knex.schema.alterTable(
            ProjectMembershipsTableName,
            (projectMembershipTable) => {
                projectMembershipTable
                    .text('role')
                    .nullable()
                    .defaultTo('member')
                    .alter();
                projectMembershipTable
                    .uuid('role_uuid')
                    .references('role_uuid')
                    .inTable('roles')
                    // Prevent deleting a role if assigned to a user
                    .onDelete('RESTRICT');
            },
        ),
    ]);

    // 'user' roles must have an organization_id, 'system' roles defined by Lightdash must not
    await knex.raw(`
        ALTER TABLE roles
            ADD CONSTRAINT user_roles_need_org
                CHECK (
                    (type = 'user' AND organization_id IS NOT NULL) OR
                    (type = 'system' AND organization_id IS NULL)
                )
    `);

    // Create scoped_roles join table
    await knex.schema.createTable(ScopedRolesTableName, (scopedRolesTable) => {
        scopedRolesTable
            .uuid('role_uuid')
            .notNullable()
            .references('role_uuid')
            .inTable('roles')
            .onDelete('CASCADE');
        scopedRolesTable.string('scope_name').notNullable();
        scopedRolesTable.timestamp('granted_at').defaultTo(knex.fn.now());
        scopedRolesTable
            .uuid('granted_by')
            .references('user_uuid')
            .inTable('users')
            .onDelete('SET NULL');

        scopedRolesTable.primary(['role_uuid', 'scope_name']);
        scopedRolesTable.index('role_uuid');
        scopedRolesTable.index('scope_name');
    });
}

export async function down(knex: Knex): Promise<void> {
    // Restore role columns as not null
    await knex.schema.alterTable(OrganizationMembershipsTableName, (table) => {
        table.text('role').notNullable().defaultTo('admin').alter();
        table.dropColumn('role_uuid');
    });

    await knex.schema.alterTable(ProjectMembershipsTableName, (table) => {
        table.text('role').notNullable().defaultTo('viewer').alter();
        table.dropColumn('role_uuid');
    });

    await knex.schema.dropTableIfExists(ScopedRolesTableName);
    await knex.schema.dropTableIfExists(RolesTableName);
}
