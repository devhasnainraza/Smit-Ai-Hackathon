

"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

type MenuItem = {
  _id?: string;
  item_id: number;
  name: string;
  price: number;
  image?: string;
};

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ name: string; price: string; image: string }>({
    name: "",
    price: "",
    image: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch menu (safe with AbortController)
  const fetchMenu = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/menu", { signal });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setMenu(Array.isArray(data?.menu) ? data.menu : []);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to fetch menu:", err);
        setMessage("Failed to load menu. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchMenu(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avoid hydration mismatch by rendering after client mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Add or Edit menu item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage("Name is required.");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setMessage("Price must be a positive number.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      if (editId !== null) {
        // Edit
        const res = await fetch(`http://localhost:8000/api/menu/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            price: priceNum,
            image: form.image.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
        setMessage("Menu item updated!");
      } else {
        // Add
        const res = await fetch("http://localhost:8000/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            price: priceNum,
            image: form.image.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
        setMessage("Menu item added!");
      }

      // Reset form and reload list
      setForm({ name: "", price: "", image: "" });
      setEditId(null);
      await fetchMenu();
    } catch (err) {
      console.error("Save failed:", err);
      setMessage("Operation failed. Please try again.");
    } finally {
      setSaving(false);
      // Auto-clear message after a bit
      setTimeout(() => setMessage(null), 2500);
    }
  };

  // Delete menu item
  const handleDelete = async (item_id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      setDeletingId(item_id);
      const res = await fetch(`http://localhost:8000/api/menu/${item_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setMessage("Menu item deleted!");
      await fetchMenu();
    } catch (err) {
      console.error("Delete failed:", err);
      setMessage("Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage(null), 2500);
    }
  };

  // Start editing
  const startEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      price: String(item.price),
      image: item.image || "",
    });
    setEditId(item.item_id);
  };

  // Cancel editing
  const cancelEdit = () => {
    setForm({ name: "", price: "", image: "" });
    setEditId(null);
  };

  if (!mounted) return null;

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-6 sm:mb-10 text-center drop-shadow-lg tracking-wide">
        🍽️ Menu Management
      </h1>

      <div className="max-w-xl mx-auto mb-6 sm:mb-10 bg-white rounded-2xl shadow-lg p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-700">
          {editId !== null ? "Edit Item" : "Add New Item"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="name"
            placeholder="Dish Name"
            value={form.name}
            onChange={handleChange}
            className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 placeholder:text-blue-400"
            required
            disabled={saving}
          />
          <input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 placeholder:text-blue-400"
            required
            min={0}
            step="0.01"
            disabled={saving}
          />
          <input
            name="image"
            placeholder="Image URL (optional)"
            value={form.image}
            onChange={handleChange}
            className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 placeholder:text-blue-400"
            disabled={saving}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className={`${
                saving ? "opacity-70 cursor-not-allowed" : ""
              } bg-blue-700 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-800 transition w-full sm:w-auto`}
            >
              {editId !== null ? (saving ? "Updating..." : "Update") : saving ? "Adding..." : "Add"}
            </button>

            {editId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-bold hover:bg-gray-400 transition w-full sm:w-auto"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && (
          <div
            className={`mt-4 font-semibold ${
              message.toLowerCase().includes("fail") ? "text-red-600" : "text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-blue-700">Loading menu...</div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full bg-white rounded-2xl shadow-2xl border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 rounded-tl-2xl">
                      Image
                    </th>
                    <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100">
                      Name
                    </th>
                    <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100">
                      Price
                    </th>
                    <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 rounded-tr-2xl">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {menu.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400 text-base sm:text-xl">
                        No menu items found.
                      </td>
                    </tr>
                  )}

                  {menu.map((item, idx) => (
                    <tr
                      key={`${item.item_id}-${idx}`}
                      className={`transition-all duration-200 ${
                        idx % 2 === 0 ? "bg-blue-50" : "bg-white"
                      } hover:bg-blue-200/60`}
                    >
                      <td className="py-3 sm:py-4 px-3 sm:px-8 text-center rounded-l-2xl">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl mx-auto shadow"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gray-200 rounded-xl mx-auto text-xl sm:text-2xl">
                            🍽️
                          </div>
                        )}
                      </td>

                      <td className="py-3 sm:py-4 px-3 sm:px-8 font-semibold text-blue-900 text-center text-sm sm:text-base">
                        {item.name}
                      </td>

                      <td className="py-3 sm:py-4 px-3 sm:px-8 text-green-700 font-bold text-center text-sm sm:text-base">
                        Rs. {item.price}
                      </td>

                      <td className="py-3 sm:py-4 px-3 sm:px-8 text-center rounded-r-2xl">
                        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                          <button
                            onClick={() => startEdit(item)}
                            className="bg-yellow-400 text-yellow-900 px-3 sm:px-4 py-1 rounded-full font-bold text-xs sm:text-sm hover:bg-yellow-500 transition w-full sm:w-auto"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.item_id)}
                            disabled={deletingId === item.item_id}
                            className={`${
                              deletingId === item.item_id ? "opacity-70 cursor-not-allowed" : ""
                            } bg-red-500 text-white px-3 sm:px-4 py-1 rounded-full font-bold text-xs sm:text-sm hover:bg-red-600 transition w-full sm:w-auto`}
                          >
                            {deletingId === item.item_id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
