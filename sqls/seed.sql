DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id           SERIAL PRIMARY KEY,
    username     VARCHAR NOT NULL
);

DROP TABLE IF EXISTS public.invoices CASCADE;
CREATE TABLE public.invoices (
    id        SERIAL PRIMARY KEY,
    title     VARCHAR,
    date      DATE NOT NULL,
    user_id   INTEGER DEFAULT NULL,

    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);
CREATE INDEX invoices_user_id_index ON public.invoices (user_id);

CREATE OR REPLACE FUNCTION create_role_if_not_exists(rolename NAME) RETURNS TEXT AS
$$
BEGIN
    IF NOT EXISTS (SELECT * FROM pg_roles WHERE rolname = rolename) THEN
        EXECUTE format('CREATE ROLE %I', rolename);
        RETURN 'CREATE ROLE';
    ELSE
        RETURN format('ROLE ''%I'' ALREADY EXISTS', rolename);
    END IF;
END;
$$
LANGUAGE plpgsql;

SELECT create_role_if_not_exists('application_user');

GRANT ALL ON SCHEMA public TO application_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO application_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO application_user;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_owner
    ON public.invoices
    AS PERMISSIVE
    FOR SELECT
    TO application_user
    USING(
        user_id=CURRENT_SETTING('auth.user_id', TRUE)::INTEGER
    );

CREATE POLICY invoice_insert
    ON public.invoices
    AS PERMISSIVE
    FOR INSERT
    TO application_user
    WITH CHECK (
        invoices.user_id = CURRENT_SETTING('auth.user_id', TRUE)::INTEGER
    );

CREATE POLICY invoice_update
    ON public.invoices
    AS PERMISSIVE
    FOR UPDATE
    TO application_user
    USING(
        user_id=CURRENT_SETTING('auth.user_id', TRUE)::INTEGER
    )
    WITH CHECK (
        invoices.user_id = CURRENT_SETTING('auth.user_id', TRUE)::INTEGER
    );

CREATE POLICY invoice_delete
    ON public.invoices
    AS PERMISSIVE
    FOR DELETE
    TO application_user
    USING(
        user_id=CURRENT_SETTING('auth.user_id', TRUE)::INTEGER
    );
