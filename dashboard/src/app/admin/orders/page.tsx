

"use client";
import React, { useEffect, useMemo, useState } from "react";

type Order = {
  _id: number; // backend aggregation ka order_id
  items: { name: string; quantity: number }[];
  total_price: number;
  status: string;
};

const statusOptions = ["in progress", "out for delivery", "delivered", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/orders`, { signal });
      if (!res.ok) throw new Error(`Orders fetch failed: ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (!isAbort) console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
      await fetchOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (q) {
        const itemNames = order.items.map((i) => i.name.toLowerCase()).join(" ");
        if (!itemNames.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-6 sm:mb-10 text-center drop-shadow-lg tracking-wide">
        🧾 Orders Management
      </h1>

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex-1 flex justify-start w-full">
          <input
            type="text"
            placeholder="Search by item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-4 py-2 w-full md:w-64 text-blue-900 placeholder:text-blue-400"
          />
        </div>
        <div className="flex-1 flex justify-center w-full">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-4 py-2 w-full md:w-48 text-blue-900"
          >
            <option key="status-all" value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={`status-${opt}`} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex justify-end w-full mt-4 md:mt-0">
          <button
            onClick={() => {
              const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
              window.open(`${apiBase}/api/orders/export`, "_blank");
            }}
            className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-full font-bold shadow hover:bg-green-700 transition text-sm sm:text-base w-full md:w-auto"
          >
            Export Orders (CSV)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full bg-white rounded-2xl shadow-2xl border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 rounded-tl-2xl text-center">
                    Order ID
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 text-center">
                    Items
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 text-center">
                    Total Price
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 rounded-tr-2xl text-center">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 && (
                  <tr key="orders-empty-row">
                    <td colSpan={4} className="py-10 text-center text-gray-400 text-base sm:text-xl">
                      No orders found.
                    </td>
                  </tr>
                )}

                {filteredOrders.map((order, rowIdx) => (
                  <tr
                    key={`order-row-${order._id}`}
                    className={`transition-all duration-200 ${
                      rowIdx % 2 === 0 ? "bg-blue-50" : "bg-white"
                    } hover:bg-blue-200/60`}
                  >
                    <td className="py-3 sm:py-4 px-3 sm:px-8 font-semibold text-blue-900 text-center rounded-l-2xl">
                      #{order._id}
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-8 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {order.items.map((item, idx) => (
                          <span
                            key={`item-chip-${order._id}-${item.name}-${idx}`}
                            className="inline-block bg-blue-100 text-blue-700 font-medium rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm"
                          >
                            {item.quantity} × {item.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-8 text-green-700 font-bold text-center">
                      Rs. {order.total_price}
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-8 text-center rounded-r-2xl" style={{ overflow: "visible" }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`px-2 sm:px-4 py-1 sm:py-2 min-w-[100px] sm:min-w-[150px] rounded-full font-semibold shadow text-xs sm:text-sm
                          border-2 border-blue-300 focus:border-4 focus:border-blue-500 focus:outline-none focus:shadow-lg
                          transition bg-white z-10
                          ${
                            order.status === "delivered"
                              ? "text-green-700 border-green-400"
                              : order.status === "out for delivery"
                              ? "text-yellow-700 border-yellow-400"
                              : order.status === "cancelled"
                              ? "text-red-700 border-red-400"
                              : "text-blue-700"
                          }`}
                        disabled={updatingId === order._id}
                        style={{ position: "relative", zIndex: 10 }}
                      >
                        {statusOptions.map((opt) => (
                          <option key={`status-opt-${order._id}-${opt}`} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
// "use client";
// import React, { useEffect, useState } from "react";

// type Order = {
//   _id: number;
//   items: { name: string; quantity: number }[];
//   total_price: number;
//   status: string;
// };

// const statusOptions = ["in progress", "out for delivery", "delivered", "cancelled"];

// export default function OrdersPage() {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");

//   const fetchOrders = async () => {
//     setLoading(true);
//     const res = await fetch("http://localhost:8000/api/orders");
//     const data = await res.json();
//     setOrders(data.orders || []);
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   const handleStatusChange = async (orderId: number, newStatus: string) => {
//     await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ status: newStatus }),
//     });
//     fetchOrders();
//   };

//   const filteredOrders = orders.filter((order) => {
//     if (statusFilter && order.status !== statusFilter) return false;
//     if (search) {
//       const itemNames = order.items.map((i) => i.name.toLowerCase()).join(" ");
//       if (!itemNames.includes(search.toLowerCase())) return false;
//     }
//     return true;
//   });

//   if (loading) return <div className="p-8 text-center">Loading...</div>;

//   return (
//     <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
//       <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-6 sm:mb-10 text-center drop-shadow-lg tracking-wide">
//         🧾 Orders Management
//       </h1>

//       {/* Top Bar */}
//       <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
//         <div className="flex-1 flex justify-start w-full">
//           <input
//             type="text"
//             placeholder="Search by item name..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="border rounded px-4 py-2 w-full md:w-64 text-blue-900 placeholder:text-blue-400"
//           />
//         </div>
//         <div className="flex-1 flex justify-center w-full">
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="border rounded px-4 py-2 w-full md:w-48 text-blue-900"
//           >
//             <option value="">All Statuses</option>
//             {statusOptions.map((opt) => (
//               <option key={`status-${opt}`} value={opt}>
//                 {opt.charAt(0).toUpperCase() + opt.slice(1)}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="flex-1 flex justify-end w-full mt-4 md:mt-0">
//           <button
//             onClick={() => window.open("http://localhost:8000/api/orders/export", "_blank")}
//             className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-full font-bold shadow hover:bg-green-700 transition text-sm sm:text-base w-full md:w-auto"
//           >
//             Export Orders (CSV)
//           </button>
//         </div>
//       </div>

//       <div className="overflow-x-auto -mx-4 sm:mx-0">
//         <div className="min-w-full inline-block align-middle">
//           <div className="overflow-hidden">
//             <table className="min-w-full bg-white rounded-2xl shadow-2xl border-separate border-spacing-0">
//               <thead>
//                 <tr>
//                   <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 rounded-tl-2xl text-center">
//                     Order ID
//                   </th>
//                   <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 text-center">
//                     Items
//                   </th>
//                   <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 text-center">
//                     Total Price
//                   </th>
//                   <th className="py-3 sm:py-4 px-3 sm:px-8 text-base sm:text-lg font-bold text-blue-700 bg-blue-100 rounded-tr-2xl text-center">
//                     Status
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredOrders.length === 0 && (
//                   <tr>
//                     <td colSpan={4} className="py-10 text-center text-gray-400 text-base sm:text-xl">
//                       No orders found.
//                     </td>
//                   </tr>
//                 )}

//                 {filteredOrders.map((order, idx) => (
//                   <tr
//                     key={`order-${order._id}-${idx}`}
//                     className={`transition-all duration-200 ${
//                       idx % 2 === 0 ? "bg-blue-50" : "bg-white"
//                     } hover:bg-blue-200/60`}
//                   >
//                     <td className="py-3 sm:py-4 px-3 sm:px-8 font-semibold text-blue-900 text-center rounded-l-2xl">
//                       #{order._id}
//                     </td>
//                     <td className="py-3 sm:py-4 px-3 sm:px-8 text-center">
//                       <div className="flex flex-wrap justify-center gap-1">
//                         {order.items.map((item, itemIndex) => (
//                           <span
//                             key={`item-${order._id}-${item.name}-${item.quantity}-${itemIndex}`}
//                             className="inline-block bg-blue-100 text-blue-700 font-medium rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm"
//                           >
//                             {item.quantity} × {item.name}
//                           </span>
//                         ))}
//                       </div>
//                     </td>
//                     <td className="py-3 sm:py-4 px-3 sm:px-8 text-green-700 font-bold text-center">
//                       Rs. {order.total_price}
//                     </td>
//                     <td className="py-3 sm:py-4 px-3 sm:px-8 text-center rounded-r-2xl" style={{ overflow: "visible" }}>
//                       <select
//                         value={order.status}
//                         onChange={(e) => handleStatusChange(order._id, e.target.value)}
//                         className={`px-2 sm:px-4 py-1 sm:py-2 min-w-[100px] sm:min-w-[150px] rounded-full font-semibold shadow text-xs sm:text-sm
//                           border-2 border-blue-300 focus:border-4 focus:border-blue-500 focus:outline-none focus:shadow-lg
//                           transition bg-white z-10 ${
//                             order.status === "delivered"
//                               ? "text-green-700 border-green-400"
//                               : order.status === "out for delivery"
//                               ? "text-yellow-700 border-yellow-400"
//                               : order.status === "cancelled"
//                               ? "text-red-700 border-red-400"
//                               : "text-blue-700"
//                           }`}
//                         style={{ position: "relative", zIndex: 10 }}
//                       >
//                         {statusOptions.map((opt) => (
//                           <option key={`status-${order._id}-${opt}`} value={opt}>
//                             {opt.charAt(0).toUpperCase() + opt.slice(1)}
//                           </option>
//                         ))}
//                       </select>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
