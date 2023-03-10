const oracledb = require('oracledb');
const { convertDate } = require('../../helper');

// list all paintings
const listAllPaintings = async (req, res) => {
    let connection;
    let paintings;
    try {
        connection = await oracledb.getConnection();

        paintings = await connection.execute(`SELECT * FROM PAINTINGS`);

        // get artist and owner names to show in all paintings section
        for (let i = 0; i < paintings.rows.length; i ++) {

            let artistID = paintings.rows[i][4];
            let ownerID = paintings.rows[i][5];

            let owner = await connection.execute(`SELECT first_name, last_name FROM OWNERS WHERE ownerID = :id`, [ownerID]);
            let ownername = owner.rows[0][0] + ' ' + owner.rows[0][1]

            let artist = await connection.execute(`SELECT first_name, last_name FROM ARTISTS WHERE artistID = :id`, [artistID]);
            let artistname = artist.rows[0][0] + ' ' + artist.rows[0][1];

            paintings.rows[i].push(artistname);
            paintings.rows[i].push(ownername);
        }

    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {

            res.render('../src/views/paintings/AllPaintings', { data: paintings.rows })

            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

// render painting form
const renderForm = async (req, res) => {
    // get artist and owners to display in lists
    let connection;
    let artists;
    let owners;
    try {
        connection = await oracledb.getConnection();

        owners = await connection.execute(`SELECT * FROM OWNERS`);
        artists = await connection.execute(`SELECT * FROM ARTISTS`);

    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {
            res.render('../src/views/paintings/NewPainting', { owners: owners.rows, artists: artists.rows });
            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

const processForm = async (req, res) => {
    let connection;

    let name = req.body.name;
    let rental = req.body.rental;
    let theme = req.body.theme;
    let artistID = parseInt(req.body.artists);
    let ownerID = parseInt(req.body.owners);
    
    
    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                insert_painting(:name, :rental, :theme, :artistID, :ownerID);
            END;`,
            {
                name: name, rental: rental, theme: theme, artistID: artistID, ownerID: ownerID
            }
        )
    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {
            res.redirect('/')

            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

const deletePainting = async (req, res) => {
    
    let connection;
    
    const paintingID = req.query.paintingID;
    
    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                delete_painting(:id);
            END;`, {id: paintingID}
        );

    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {

            res.redirect('/paintings')

            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

const hirePainting = async (req, res) => {
    let connection;

    let result;
    let data = [];
    let customers;

    try {
        connection = await oracledb.getConnection();

        result = await connection.execute(
            `BEGIN
                get_available_paintings(:cursor);
            END;`,
            {
                cursor: {
                    type: oracledb.CURSOR, 
                    dir: oracledb.BIND_OUT
                }
            }
        )

        customers = await connection.execute(
            `SELECT customerID, first_name, last_name FROM CUSTOMERS`
        );

        const cursor = result.outBinds.cursor;
        const queryStream = cursor.toQueryStream();

        const consumeStream = new Promise((resolve, reject) => {
            queryStream.on('data', function (row) {
                data.push(row)
            });
            queryStream.on('error', reject);
            queryStream.on('close', resolve);
        });

        await consumeStream;

    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {
            res.render('../src/views/paintings/HirePainting', {data: data, customers: customers.rows});

            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

const processHirePainting = async (req, res) => {
    
    let {rentdate, duedate, artistID, customerID} = req.body;

    // convert dates to ORACLE format
    rentdate = convertDate(rentdate);
    duedate = convertDate(duedate);

    let connection;

    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                rent_painting(:rentdate, :duedate, :customerID, :artistID);
            END;`,
            {
                rentdate: rentdate, duedate: duedate, customerID: customerID, artistID: artistID
            }
        )
       
    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {

            res.redirect('/')

            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

const returnPainting = async (req, res) => {
    let connection;
    const pid = parseInt(req.query.paintingID);
    let errMsg = null;
    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                return_to_owner(:pid);
            END;`, {pid: pid}
        );
       
    }
    catch (err) {
        errMsg = err;
        res.render('../src/views/ErrorPage', {errMsg: errMsg})
        console.log(err);
    }
    finally {
        try {
            if (!errMsg) {
                res.redirect('/paintings')
            }
            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}


// render painting form
const showEditForm = async (req, res) => {
    // get artist and owners to display in lists
    let connection;
    let artists;
    let owners;
    let painting;
    const paintingID = req.query.paintingID;
    try {
        connection = await oracledb.getConnection();

        painting = await connection.execute(`SELECT * FROM paintings WHERE paintingID = :id`, [paintingID])
        painting = painting.rows[0]
        owners = await connection.execute(`SELECT * FROM OWNERS`);
        artists = await connection.execute(`SELECT * FROM ARTISTS`);

    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {
            res.render('../src/views/paintings/EditPainting', {err: null, data: painting, owners: owners.rows, artists: artists.rows });
            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}

const editPainting = async (req, res) => {
    let connection;

    let name = req.body.name;
    let rental = req.body.rental;
    let theme = req.body.theme;
    let artistID = parseInt(req.body.artists);
    let ownerID = parseInt(req.body.owners);
    
    try {
        connection = await oracledb.getConnection();

        await connection.execute(
            `BEGIN
                update_painting(:pid, :name, :rental, :theme, :artistID, :ownerID);
            END;`,
            {
                pid: req.query.paintingID, name: name, rental: rental, theme: theme, artistID: artistID, ownerID: ownerID
            }
        )
    }
    catch (err) {

        console.log(err);
    }
    finally {
        try {
            res.redirect(`/paintings`)

            await connection.close()
        }
        catch (err) {
            console.log(err.message)
        }
    }
}


module.exports = {
    renderForm,
    processForm,
    listAllPaintings,
    deletePainting,
    hirePainting, 
    processHirePainting,
    returnPainting,
    showEditForm, 
    editPainting
}