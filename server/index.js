const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let customOrder = [];
let selectedSet = new Set();

const TOTAL = 1000000;
function getOrderedList() {
  if (customOrder.length) {
    const set = new Set(customOrder);
    const rest = [];
    for (let i = 1; i <= TOTAL; i++) if (!set.has(i)) rest.push(i);
    return [...customOrder, ...rest];
  }
  return Array.from({ length: TOTAL }, (_, i) => i + 1);
}

app.get("/items", (req, res) => {
  const { search = "", offset = 0, limit = 20 } = req.query;
  let list = getOrderedList().map((id) => ({
    id,
    label: String(id),
    selected: selectedSet.has(id),
  }));
  if (search) {
    list = list.filter((item) => item.label.includes(search));
  }
  const start = parseInt(offset),
    len = parseInt(limit);
  const batch = list.slice(start, start + len);
  res.json({ items: batch, total: list.length });
});

app.post("/select", (req, res) => {
  const { id, selected } = req.body;
  if (selected) selectedSet.add(id);
  else selectedSet.delete(id);
  res.sendStatus(200);
});

app.post("/order", (req, res) => {
  const { orderedIds } = req.body;
  customOrder = orderedIds;
  res.sendStatus(200);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
