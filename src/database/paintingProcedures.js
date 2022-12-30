// ------ TRIGGERS ------

const checkDatesTrigger = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE TRIGGER check_rent_dates
        BEFORE INSERT OR UPDATE ON RENTED
        FOR EACH ROW
        BEGIN
            IF (:new.rent_date > :new.due_date OR
                :new.return_date < :new.rent_date) THEN
                RAISE_APPLICATION_ERROR(-20001, 'Invalid rent date or return date');
                END IF;
            END;`
    )
}


// ------ PROCEDURES ------
const insertPaintingProcedure = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE PROCEDURE insert_painting(
            p_name VARCHAR, rental NUMBER, p_theme VARCHAR, a_id NUMBER, o_id NUMBER) AS
        BEGIN
            INSERT INTO PAINTINGS (name, monthly_rental, theme, artistID, ownerID) 
            VALUES (p_name, rental, p_theme, a_id, o_id);

            COMMIT;
        END;`
    )
}

const deletePaintingProcedure = async (connection) => {
    connection.execute(
        `CREATE OR REPLACE PROCEDURE delete_painting (id NUMBER) AS
        BEGIN
            DELETE FROM PAINTINGS WHERE paintingID = id;
            COMMIT;
        END;`
    )
}

const getAvailablePaintingsProcedure = async (connection) => { 
    await connection.execute(
        `CREATE OR REPLACE PROCEDURE get_available_paintings (records OUT SYS_REFCURSOR) AS
        BEGIN
            OPEN records FOR
            SELECT
            * FROM PAINTINGS 
            WHERE status = 'available';
        END;
                `
    )
}

const rentPaintingProcedure = async (connection) => {
    await connection.execute(
        `CREATE OR REPLACE PROCEDURE rent_painting (
            rentdate DATE, duedate DATE, c_id NUMBER, p_id NUMBER
        ) AS
        BEGIN
            INSERT INTO RENTED (rent_date, due_date, returned, customerID, paintingID)
            VALUES (rentdate, duedate, 0, c_id, p_id);

            UPDATE PAINTINGS SET status = 'hired' WHERE paintingID = p_id;

            COMMIT;
        END;`
    )
}

const createPaintingProcedures = async (connection) => {
    await insertPaintingProcedure(connection);
    await deletePaintingProcedure(connection);
    await getAvailablePaintingsProcedure(connection);
    await rentPaintingProcedure(connection);
    await checkDatesTrigger(connection);
}

module.exports = createPaintingProcedures