# Database bootstrap

Run `001_initial.sql` against the PostgreSQL database before enabling the admin area.

The schema deliberately keeps scripture text separate from metadata and files. Only verified, rights-cleared source content should be inserted. Never seed invented verses.

For the first SUPER_ADMIN, generate a bcrypt password hash outside the browser and insert the user with role `SUPER_ADMIN`. Do not hard-code credentials in source control.
