const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();

const SECRET = "secret123";

app.use(express.json());

// Serve static frontend from "public" folder
app.use(express.static(path.join(__dirname, "public")));

const users = [];
const todos = {};

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes (same as before, just no CORS now)
app.post("/api/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: "Missing credentials" });

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ msg: "User already exists" });
  }

  users.push({ username, password });
  res.json({ msg: "Signup successful" });
});

app.post("/api/signin", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(403).json({ msg: "Invalid credentials" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.get("/api/todos", authenticateToken, (req, res) => {
  const userTodos = todos[req.user.username] || [];
  res.json(userTodos);
});

app.post("/api/todos", authenticateToken, (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ msg: "Title required" });

  const newTodo = { id: Date.now(), title, done: false };
  if (!todos[req.user.username]) todos[req.user.username] = [];
  todos[req.user.username].push(newTodo);

  res.json(newTodo);
});

app.put("/api/todos/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, done } = req.body;

  const userTodos = todos[req.user.username] || [];
  const todo = userTodos.find(t => t.id == id);
  if (!todo) return res.status(404).json({ msg: "Todo not found" });

  if (title !== undefined) todo.title = title;
  if (done !== undefined) todo.done = done;

  res.json(todo);
});

app.delete("/api/todos/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  todos[req.user.username] = (todos[req.user.username] || []).filter(t => t.id != id);
  res.json({ msg: "Deleted successfully" });
});

app.listen (3001);