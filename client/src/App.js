import "./App.css";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function App() {
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  const fetchBatch = useCallback(
    async (reset = false) => {
      if (loading && !reset) return;

      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(
        `http://localhost:4000/items?search=${search}&offset=${currentOffset}&limit=20`
      );
      const data = await response.json();
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setOffset(currentOffset + 20);
      setHasMore(currentOffset + 20 < data.total);
      setLoading(false);
    },
    [search, offset, loading]
  );

  useEffect(() => {
    fetchBatch(true);
  }, [search]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5 && hasMore) {
      fetchBatch();
    }
  };

  const toggleSelect = async (id, checked) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: checked } : item
      )
    );
    await fetch("http://localhost:4000/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, selected: checked }),
    });
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);
    const fullIds = reordered.map((item) => item.id);
    await fetch("http://localhost:4000/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: fullIds }),
    });
  };

  return (
    <div
      ref={containerRef}
      style={{ height: "80vh", overflow: "auto" }}
      onScroll={handleScroll}
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {items.map((item, index) => (
                <Draggable
                  key={item.id.toString()}
                  draggableId={item.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px",
                        margin: "4px 0",
                        border: "1px solid #ccc",
                        ...provided.draggableProps.style,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!item.selected}
                        onChange={(e) =>
                          toggleSelect(item.id, e.target.checked)
                        }
                      />
                      <span style={{ marginLeft: "8px" }}>{item.label}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {loading && <div>Loading...</div>}
    </div>
  );
}

export default App;
