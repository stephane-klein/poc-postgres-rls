TRUNCATE users, invoices;
VACUUM;
ALTER SEQUENCE invoices_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

DROP INDEX IF EXISTS invoices_user_id_index;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS fk_user_id;

INSERT INTO users (id, username)
(
    SELECT
        user_id,
        'username_' || TO_CHAR(user_id, 'FM0000')
    FROM GENERATE_SERIES(1, 1000) AS user_id
);

INSERT INTO invoices (date, user_id)
(
    SELECT
        CURRENT_DATE + seq AS date,
        user_id
    FROM
        GENERATE_SERIES(1, 2000) AS seq,
        GENERATE_SERIES(1, 1000) AS user_id
);

ALTER TABLE public.invoices ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
CREATE INDEX invoices_user_id_index ON public.invoices (user_id);
