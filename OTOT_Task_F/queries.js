const Pool = require("pg").Pool;
const asyncHandler = require("express-async-handler");
var pool;

if (process.env.DATABASE_URL) {
  console.log(process.env.DATABASE_URL)
  const connectionString = process.env.DATABASE_URL

  pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})
} else {
  console.log({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
  })

  pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'api',
  password: 'postgres',
  port: '5003' 
})
}

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  client.query("SELECT NOW()", (err, result) => {
    release();
    if (err) {
      return console.error("Error executing query", err.stack);
    }
    console.log(result.rows);
  });
});

pool.on("connect", (client) => {
  console.log("connected");
  console.log("Post Deployment Test");
});

pool.on("error", (err) => {
  console.log(err);
});

const ERROR_NO_USER_ID = "Bad Request. No user id provided.";
const ERROR_NO_NAME = "Bad Request. No name provided.";
const ERROR_NO_EMAIL = "Bad Request. No email provided."
const ERROR_NO_ID = "Bad Request. No ID provided."

// GET Users
const getUsers = (req, res) => {
  pool.query("SELECT * FROM users ORDER BY id", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};

// GET user by ID
const getUserById = (req, res) => {
  const id = parseInt(req.params.id);

  if (!id) {
    return res.status(400).send(ERROR_NO_USER_ID);
  }

  pool.query("SELECT * FROM users WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};

// POST new user
const createUser = asyncHandler( async (req, res) => {
  const { id, name, email } = req.body;
  if (!id) {
    return res.status(400).send(ERROR_NO_ID);
  }

  if (!name) {
    return res.status(400).send(ERROR_NO_NAME);
  }

  if (!email) {
    return res.status(400).send(ERROR_NO_EMAIL);
  }

  await addUser(id, name, email).catch(err => {
    console.log(err);
    return res.status(500).send(err.detail);
  })

  res.status(201).send(`User added with ID: ${id}`);
});

async function addUser(id, name, email) {
  try {
      const result = await pool.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)",
      [id, name, email]);
      return result.row;
  } catch (err) {
      throw err;
  }
}

// UPDATE user
const updateUser = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).send(ERROR_NO_NAME);
  }

  if (!email) {
    return res.status(400).send(ERROR_NO_EMAIL);
  }

  if (!id) {
    return res.status(400).send(ERROR_NO_ID);
  }

  pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3",
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).send(`User modified with ID: ${id}`);
    }
  );
};

// DELETE user
const deleteUser = (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (!id) {
      throw new Error("Shit happened");
    }
    pool.query("DELETE FROM users WHERE id = $1", [id], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).send(`User deleted with ID: ${id}`);
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
};
