const express = require("express");
const pool = require("./db");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // parse JSON bodies   ​

const person = { name: "Tamara", email: "tauj0001@stud.ek.dk" };
const { name, email } = person; // destructuring
console.log(name);
console.log(email);

// front end
// const result = await fetch("http://localhost:3000/books",
//     {
//         method: "POST",
//         body: JSON.stringify(bodyObjectHere)
//     }
// )
// if (!result.ok) { // here we would use the status code from the server
//     throw new Error("Something went wrong");
// }

app.get("/loans", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM library.loans");
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post("/books", async (req, res) => {
  const { book, fk_members } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO books (title, author)
             VALUES ($1, $2)
             RETURNING id, title, author`,
      [book, fk_members],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// sign up
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("INSERT INTO library.users (username, password) VALUES ($1, $2) RETURNING id, username", [username, password]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

// login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT id, username, password FROM library.users WHERE username = $1", [username]);

    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    res.status(200).json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/loans/:id", async (req, res) => {
  const { book, fk_members } = req.body;

  try {
    const upd = await pool.query(
      `UPDATE library.loans SET book = $1, fk_members = $2
             WHERE id = $3
             RETURNING id, book, fk_members`,
      [book, fk_members, req.params.id],
    );
    if (upd.rowCount === 0) return res.status(404).send({ message: "Loan not found" });

    res.status(200).json(upd.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/loans/:id", async (req, res) => {
  try {
    const del = await pool.query("DELETE FROM library.loans WHERE id = $1", [req.params.id]);
    if (del.rowCount === 0) return res.status(404).send({ message: "Loan not found" });

    res.status(204).send({ status: "loan deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// app.post("/books", async (req, res) => {
//   console.log(req.body);

//   res.status(201).send({ status: "ok" });
// });

// app.put("/books/:booksId", (req, res) => {
//   console.log(req.params.booksId);
//   res.status(200).send({ status: "book updated" });
// });

// app.put("/loans", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM library.loans");
//     console.log(result.rows);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     res.status(500).send({ message: error.message });
//   }
// }); DETTE ER DEN RIGTIGE VERSION

// app.delete("/loans", async (req, res) => {
//   try {
//     const del = await pool.query("DELETE FROM books WHERE id = $1", [req.params.id]);
//     if (del.rowCount === 0) return res.sendStatus(404);

//     res.sendStatus(204);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database error" });
//   }
// });
