const styles = {
  confirmed: "bg-amber-100 text-amber-900",
  shipped: "bg-blue-100 text-blue-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-gray-200 text-gray-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold capitalize ${styles[status] || styles.confirmed}`} data-testid="order-status">
      {status}
    </span>
  );
}
