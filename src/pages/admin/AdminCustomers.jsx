import ErrorBox from "../../components/ErrorBox.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import { money } from "../../utils/format.js";

export default function AdminCustomers() {
  const { data, loading, error, reload } = useFetch("/admin/customers");
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">Customers</h1>
      {loading && !data ? <p className="text-sm text-muted">Loading</p> : null}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3 text-right">Orders</th><th className="p-3 text-right">Spent</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data || []).map((u) => (
              <tr key={u.id}>
                <td className="p-3 text-ink">{u.name}</td>
                <td className="p-3 text-ink">{u.email}</td>
                <td className="p-3 capitalize text-ink">{u.role}</td>
                <td className="p-3 text-muted">{new Date(u.createdAt.replace(" ", "T") + "Z").toLocaleDateString("en-US")}</td>
                <td className="p-3 text-right text-ink">{u.orders}</td>
                <td className="p-3 text-right text-ink">{money(u.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
