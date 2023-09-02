TRUNCATE users, invoices;
VACUUM;
ALTER SEQUENCE invoices_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

ALTER TABLE invoices SET UNLOGGED;
ALTER TABLE users SET UNLOGGED;

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
             GENERATE_SERIES(1, 200) AS seq,
             GENERATE_SERIES(1, 1000) AS user_id
     );

ALTER TABLE users SET LOGGED;
ALTER TABLE invoices SET LOGGED;
