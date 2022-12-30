// create trigger for date of birth
const checkDobTrigger = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE TRIGGER check_dob
        BEFORE INSERT OR UPDATE ON ARTISTS
        FOR EACH ROW
        BEGIN
            IF (:new.dob > SYSDATE OR :new.dob > :new.death_date) THEN
            RAISE_APPLICATION_ERROR(-20001, 'Invalid date of birth');
            END IF;
        END;`
    )
}

const checkDodTrigger = async(connection) => {
    await connection.execute(
        `CREATE OR REPLACE TRIGGER check_dod
        BEFORE INSERT OR UPDATE ON ARTISTS
        FOR EACH ROW
        BEGIN
            IF (:new.death_date > :new.death_date OR :new.death_date > SYSDATE) THEN
            RAISE_APPLICATION_ERROR(-20001, 'Invalid date of death');
            END IF;
        END;`
    )
}

// insert a new artist procedure
const insertArtistProcedure = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE PROCEDURE insert_artist (
            f_name VARCHAR, l_name VARCHAR, 
            a_country VARCHAR, a_dob DATE, 
            a_death DATE
            )
        IS
            age number;
            alive number;
        BEGIN

            IF a_death IS NULL THEN
                age := (EXTRACT(YEAR FROM SYSDATE) - EXTRACT(YEAR FROM a_dob));
                alive := 1; 
            ELSE
                alive := 0;
                age := (EXTRACT(YEAR FROM a_death) - EXTRACT(YEAR FROM a_dob));
            END IF;
        
            
    
            INSERT INTO ARTISTS (first_name, last_name, country, dob, death_date, alive, age) 
            VALUES (
                f_name, l_name, a_country, a_dob, a_death, alive, age
            );

            COMMIT;

        END;
        `
    )
}

// deleting artists - procedure
const deleteArtistProcedure = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE PROCEDURE delete_artist (a_id NUMBER) AS
        BEGIN
            DELETE FROM ARTISTS WHERE artistID = a_id;
                
            COMMIT;
        END;`
    )
}

const generateReportProcedure = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE PROCEDURE get_artist_report (
            id IN NUMBER, records OUT SYS_REFCURSOR
        ) AS
        BEGIN
            OPEN records FOR
            SELECT 
            A.artistID, A.first_name, A.last_name, A.dob, A.age, A.death_date, 
            A.country, P.paintingID, P.name, P.theme, P.monthly_rental, 
            O.ownerID, O.first_name, O.last_name, O.cellphone
        FROM PAINTINGS P
            INNER JOIN OWNERS O ON P.ownerID = O.ownerID
            INNER JOIN ARTISTS A ON P.artistID = A.artistID
            WHERE A.artistID = id;
        END;`
    )
}

const createArtistProcedures = async (connection) => {
    await insertArtistProcedure(connection)
    await deleteArtistProcedure(connection)
    await checkDobTrigger(connection)
    await checkDodTrigger(connection)
    await generateReportProcedure(connection)
}

module.exports = createArtistProcedures