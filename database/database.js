const mysql = require("mysql2");
require("dotenv").config();

//variaveis para banco
DB_PASS = process.env.DB_PASS;
DB_USER = process.env.DB_USER;
DATABASE = process.env.DATABASE;

const con = mysql.createConnection({
  host: "localhost",
  user: DB_USER,
  password: DB_PASS,
  database: DATABASE,
});

con.connect(function (err) {
  if (err) throw err;

  console.log("Database connected.");
});

// aqui estamos usando o mysql sem

module.exports = con