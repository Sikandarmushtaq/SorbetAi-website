import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, Package, Plus, ShoppingBag } from 'lucide-react';
import { EmptyState, FieldInput, FieldTextarea, FormField, Modal, PageHeader, Panel, StatCard, StatGrid, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { downloadCsv } from '../../../utils/csv';

const orderStatuses = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Manages frontend order drafts, status filters, and CSV export.
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', phone: '', address: '', item: '', notes: '', total: '' });
  const { showNotice, Notice } = useNotice();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const visibleOrders = useMemo(() => tab === 'All' ? orders : orders.filter((order) => order.status === tab), [orders, tab]);
  const submit = (event) => {
    event.preventDefault();
    setOrders((current) => [{ ...form, id: Date.now(), status: 'Pending', date: new Date().toLocaleDateString() }, ...current]);
    setForm({ customer: '', phone: '', address: '', item: '', notes: '', total: '' });
    setIsOpen(false);
    showNotice('Order added to this local preview. It will be stored by the backend after integration.');
  };
  const exportOrders = () => downloadCsv('bellbee-orders.csv', ['Customer', 'Phone', 'Address', 'Item', 'Total', 'Status', 'Date'], orders.map((order) => [order.customer, order.phone, order.address, order.item, order.total, order.status, order.date]));
  return <>
    <PageHeader eyebrow="MANAGE" title="Orders" description="Manage and track your business sales." actions={<><button type="button" className="dp-secondary-button" onClick={exportOrders}>Export CSV</button><button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add order</button></>} />
    {Notice}
    <StatGrid columns={4}><StatCard label="Revenue today" value={`PKR ${orders.reduce((sum, order) => sum + Number(order.total || 0), 0).toLocaleString()}`} icon={CreditCard} /><StatCard label="Pending" value={orders.filter((order) => order.status === 'Pending').length} icon={Clock3} accent="yellow" /><StatCard label="Shipping" value={orders.filter((order) => order.status === 'Shipped').length} icon={Package} accent="lavender" /><StatCard label="Delivered" value={orders.filter((order) => order.status === 'Delivered').length} icon={CheckCircle2} accent="green" /></StatGrid>
    <Panel><div className="dp-toolbar dp-toolbar-between"><span className="dp-toolbar-label">Sorted by: Date (newest)</span><button type="button" className="dp-secondary-button" onClick={() => showNotice('More order filters will be available when order records are connected.')}>Filter</button></div><Tabs items={orderStatuses} active={tab} onChange={setTab} />
      {visibleOrders.length ? <div className="dp-data-list"><div className="dp-data-list-heading"><span>Customer</span><span>Item</span><span>Total</span><span>Status</span><span>Date</span></div>{visibleOrders.map((order) => <div className="dp-data-list-row" key={order.id}><strong>{order.customer}</strong><span>{order.item || '—'}</span><span>PKR {Number(order.total || 0).toLocaleString()}</span><span className="dp-status-pill warning">{order.status}</span><span>{order.date}</span></div>)}</div> : <EmptyState icon={ShoppingBag} title={tab === 'All' ? 'No orders yet' : `No ${tab.toLowerCase()} orders`} description="Orders your AI takes in chats will show up here automatically. You can also add one yourself." buttonText="Add an order" onAction={() => setIsOpen(true)} />}
    </Panel>
    {isOpen && <Modal title="Create order" description="Add an order manually to your business records." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="order-form" className="dp-primary-button">Create order <Plus size={14} /></button></>}>
      <form id="order-form" className="dp-form-grid" onSubmit={submit}>
        <FormField label="Customer name"><FieldInput value={form.customer} onChange={(event) => update('customer', event.target.value)} required /></FormField>
        <FormField label="Phone number"><FieldInput value={form.phone} onChange={(event) => update('phone', event.target.value)} required /></FormField>
        <FormField label="Delivery address" className="dp-form-full"><FieldTextarea rows={2} value={form.address} onChange={(event) => update('address', event.target.value)} required /></FormField>
        <FormField label="Items"><FieldInput value={form.item} onChange={(event) => update('item', event.target.value)} placeholder="Custom item..." /></FormField>
        <FormField label="Total (PKR)"><FieldInput type="number" min="0" value={form.total} onChange={(event) => update('total', event.target.value)} /></FormField>
        <FormField label="Notes" className="dp-form-full"><FieldTextarea rows={2} value={form.notes} onChange={(event) => update('notes', event.target.value)} /></FormField>
      </form>
    </Modal>}
  </>;
}
