export const DEMO_SEED_SQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  created_at TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL,
  category TEXT
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  amount REAL NOT NULL,
  created_at TEXT
);

INSERT INTO users (id, name, email, age, created_at) VALUES
  (1, 'John Smith', 'john@gmail.com', 25, '2024-01-15'),
  (2, 'Sarah Johnson', 'sarah@gmail.com', 31, '2024-02-20'),
  (3, 'Mike Wilson', 'mike@gmail.com', 28, '2024-03-10'),
  (4, 'Emily Davis', 'emily@gmail.com', 35, '2024-01-28'),
  (5, 'Chris Brown', 'chris@gmail.com', 22, '2024-04-05');

INSERT INTO products (id, name, price, category) VALUES
  (1, 'Laptop Pro', 1299.99, 'Electronics'),
  (2, 'Wireless Mouse', 29.99, 'Electronics'),
  (3, 'Desk Chair', 249.00, 'Furniture'),
  (4, 'Coffee Maker', 89.50, 'Appliances'),
  (5, 'Notebook Set', 12.99, 'Office');

INSERT INTO orders (id, user_id, product_id, amount, created_at) VALUES
  (1, 1, 1, 1299.99, '2024-02-01'),
  (2, 2, 2, 29.99, '2024-02-15'),
  (3, 1, 3, 249.00, '2024-03-01'),
  (4, 3, 4, 89.50, '2024-03-20'),
  (5, 4, 1, 1299.99, '2024-04-01'),
  (6, 2, 5, 12.99, '2024-04-10'),
  (7, 5, 2, 29.99, '2024-04-15'),
  (8, 3, 3, 249.00, '2024-05-01');
`;

export const SQL_SNIPPETS = [
  { name: "Select all", sql: "SELECT * FROM users;" },
  { name: "Top customers", sql: "SELECT u.name, SUM(o.amount) AS total\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nORDER BY total DESC;" },
  { name: "Orders by date", sql: "SELECT DATE(created_at) AS day, COUNT(*) AS orders\nFROM orders\nGROUP BY DATE(created_at)\nORDER BY day;" },
  { name: "Product sales", sql: "SELECT p.name, COUNT(o.id) AS sold, SUM(o.amount) AS revenue\nFROM products p\nJOIN orders o ON p.id = o.product_id\nGROUP BY p.id, p.name;" },
];
