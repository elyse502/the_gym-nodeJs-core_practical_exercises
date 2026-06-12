/**
This layer should know:

where users are stored
how users are persisted

and nothing about Express.

Example methods:

findAll()
findById()
findByEmail()
create()
delete()

Why?

If tomorrow:

users.json

becomes:

PostgreSQL

the controller should not change.

Only the repository changes.
 */
