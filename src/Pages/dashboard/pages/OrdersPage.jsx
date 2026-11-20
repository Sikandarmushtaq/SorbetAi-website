import { ordersApi } from '../../../services/dashboard/orders.api.js';
import { productsApi } from '../../../services/dashboard/products.api.js';
import './OrdersPage.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Download, Plus, Search, ShoppingBag, Truck } from 'lucide-react';
import { EmptyState, FieldInput, FieldTextarea, FormField, Modal, PageHeader, Panel, StatCard, StatGrid, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { downloadCsv } from '../../../utils/csv';

const orderStatuses = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];
const emptyForm = { customer_name: '', phone: '', address: '', notes: '' };
const csvHeaders = ['Customer', 'Items', 'Total', 'Status', 'Date'];

function orderRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.orders || [];
}

function orderId(order) {
  return String(order.id || order.order_id || order.order_number || '');
}

function orderCustomer(order) {
  return order.customer_name || order.customer?.full_name || order.customer?.name || order.customer || 'Customer';
}

function orderItems(order) {
  if (Array.isArray(order.items)) return order.items.map((item) => `${item.name || item.product_name || 'Item'}${item.quantity ? ` × ${item.quantity}` : ''}`).join(', ');
  return order.items || order.item_summary || order.item || '—';
}

function orderStatus(order) {
  return String(order.status || 'pending').toLowerCase().replaceAll(' ', '_');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Loads saved orders from the API, derives status metrics, and keeps search and status filters in the URL.
export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [catalog, setCatalog] = useState([]);
  const [lines, setLines] = useState([]);
  const [itemDraft, setItemDraft] = useState({ product_id: '', name: '', price: '', quantity: 1 });
  const { showNotice, Notice } = useNotice();
  const requestedStatus = searchParams.get('status') || 'all';
  const activeStatus = orderStatuses.some((item) => item.value === requestedStatus) ? requestedStatus : 'all';
  const query = searchParams.get('q') || '';

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await ordersApi.request();
      setOrders(orderRecords(response));
      setSummary(response?.summary || response?.metrics || null);
    } catch (error) {
      setOrders([]);
      setSummary(null);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...orders]
      .filter((order) => activeStatus === 'all' || orderStatus(order) === activeStatus)
      .filter((order) => !needle || orderCustomer(order).toLowerCase().includes(needle) || String(order.phone || order.customer?.phone || '').toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.created_at || b.date || b.order_date || 0).getTime() - new Date(a.created_at || a.date || a.order_date || 0).getTime());
  }, [orders, activeStatus, query]);

  const todayKey = localDateKey(new Date());
  const todayRevenue = summary?.revenue_today ?? summary?.today_revenue ?? orders
    .filter((order) => localDateKey(order.created_at || order.date || order.order_date) === todayKey)
    .reduce((total, order) => total + Number(order.total || order.total_amount || order.amount || 0), 0);
  const pendingCount = summary?.pending_count ?? orders.filter((order) => orderStatus(order) === 'pending').length;
  const shippingCount = summary?.shipping_count ?? orders.filter((order) => ['processing', 'shipped'].includes(orderStatus(order))).length;
  const deliveredCount = summary?.delivered_count ?? orders.filter((order) => orderStatus(order) === 'delivered').length;

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (key === 'status' && value === 'all')) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('status');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!isOpen || !productsApi.isConfigured()) return undefined;
    let active = true;
    productsApi.request().then((response) => {
      if (active) setCatalog(Array.isArray(response) ? response : response?.items || response?.products || response?.results || []);
    }).catch((error) => { if (active) showNotice(error.message); });
    return () => { active = false; };
  // The catalogue only needs to load when the order editor opens.
  }, [isOpen]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const calculatedTotal = lines.reduce((sum, line) => sum + Number(line.price) * Number(line.quantity), 0);
  const addLine = () => {
    if (!itemDraft.name.trim() || !Number.isFinite(Number(itemDraft.price)) || Number(itemDraft.price) < 0 || Number(itemDraft.quantity) < 1) {
      showNotice('Enter an item name, a valid price and a quantity of at least one.'); return;
    }
    setLines((current) => [...current, { ...itemDraft, name: itemDraft.name.trim(), price: Number(itemDraft.price), quantity: Number(itemDraft.quantity) }]);
    setItemDraft({ product_id: '', name: '', price: '', quantity: 1 });
  };

  const createOrder = async (event) => {
    event.preventDefault();
    if (!lines.length) { showNotice('Add at least one order item.'); return; }
    setIsSaving(true);
    try {
      await ordersApi.request({
        method: 'POST',
        body: {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          delivery_address: form.address.trim(),
          items_description: lines.map((line) => `${line.name} x ${line.quantity}`).join(', '),
          items: lines.map((line) => ({ ...(line.product_id ? { product_id: line.product_id } : {}), name: line.name, quantity: line.quantity, unit_price: line.price })),
          notes: form.notes.trim(),
          total: calculatedTotal,
          currency: 'PKR',
        },
      });
      setForm(emptyForm);
      setLines([]);
      setIsOpen(false);
      showNotice('Order saved successfully.');
      await loadOrders();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOrderStatus = async (order, nextStatus) => {
    const id = orderId(order);
    setStatusUpdatingId(id);
    try {
      await ordersApi.request({ method: 'PATCH', id, body: { status: nextStatus } });
      setOrders((current) => current.map((item) => orderId(item) === id ? { ...item, status: nextStatus } : item));
    } catch (error) {
      showNotice(error.message);
    } finally {
      setStatusUpdatingId('');
    }
  };

  const exportOrders = () => downloadCsv('bellbee-orders.csv', csvHeaders, visibleOrders.map((order) => [orderCustomer(order), orderItems(order), order.total ?? order.total_amount ?? order.amount ?? '', orderStatus(order), order.created_at || order.date || order.order_date || '']));
  const orderTotal = (order) => {
    const value = order.total ?? order.total_amount ?? order.amount;
    return value === undefined || value === null || value === '' ? '—' : `PKR ${Number(value).toLocaleString()}`;
  };

  const selectStatus = (label) => updateParam('status', orderStatuses.find((item) => item.label === label)?.value || 'all');
  const statusLabel = (value) => orderStatuses.find((item) => item.value === value)?.label || value;

  return (
    <>
      <PageHeader
        eyebrow="MANAGE"
        title="Orders"
        description="Manage and track your business sales."
        actions={<><button type="button" className="dp-secondary-button" onClick={exportOrders} disabled={!orders.length}><Download size={14} /> Export</button><button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Create Order</button></>}
      />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <StatGrid columns={4}>
        <StatCard label="Revenue Today" value={isLoading ? '—' : `PKR ${Number(todayRevenue || 0).toLocaleString()}`} icon={CreditIcon} />
        <StatCard label="Pending" value={isLoading ? '—' : Number(pendingCount || 0)} icon={Clock3} accent="yellow" />
        <StatCard label="Shipping" value={isLoading ? '—' : Number(shippingCount || 0)} icon={Truck} accent="lavender" />
        <StatCard label="Delivered" value={isLoading ? '—' : Number(deliveredCount || 0)} icon={CheckCircle2} accent="green" />
      </StatGrid>
      <Panel className="dp-orders-panel">
        <label className="dp-search-input dp-orders-search"><Search size={16} /><input type="search" value={query} onChange={(event) => updateParam('q', event.target.value)} placeholder="Search customer name..." /></label>
        <div className="dp-toolbar dp-toolbar-between"><span className="dp-toolbar-label">SORT BY <strong>Date (Newest)</strong></span><span className="dp-muted">{visibleOrders.length} orders</span></div>
        <Tabs items={orderStatuses.map((item) => item.label)} active={statusLabel(activeStatus)} onChange={selectStatus} />
        {isLoading ? <div className="dp-api-empty-state">Loading orders…</div> : visibleOrders.length ? (
          <div className="dp-data-list dp-orders-table">
            <div className="dp-data-list-heading"><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span>Date</span><span>Actions</span></div>
            {visibleOrders.map((order) => {
              const id = orderId(order);
              const status = orderStatus(order);
              return <div className="dp-data-list-row" key={id}>
                <div><strong>{orderCustomer(order)}</strong><small>{order.phone || order.customer?.phone || ''}</small></div>
                <span>{orderItems(order)}</span>
                <strong>{orderTotal(order)}</strong>
                <span className={`dp-status-pill ${status === 'delivered' ? 'success' : status === 'cancelled' ? 'danger' : status === 'shipped' ? 'info' : 'warning'}`}>{statusLabel(status)}</span>
                <time>{formatDate(order.created_at || order.date || order.order_date)}</time>
                <select aria-label={`Change status for ${orderCustomer(order)}`} value={status} disabled={statusUpdatingId === id} onChange={(event) => updateOrderStatus(order, event.target.value)}>
                  {orderStatuses.filter((item) => item.value !== 'all').map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>;
            })}
          </div>
        ) : loadError ? (
          <div className="dp-api-empty-state"><ShoppingBag size={22} /><strong>Orders are ready to connect</strong><p>Connect the orders API to load customer purchases and order totals.</p></div>
        ) : query || activeStatus !== 'all' ? (
          <EmptyState icon={Search} title="No matches" description="No orders match your current search or status filter." buttonText="Clear filters" onAction={clearFilters} />
        ) : (
          <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders your AI takes in chats will show up here automatically. You can also add one yourself." buttonText="Add order" onAction={() => setIsOpen(true)} />
        )}
      </Panel>

      {isOpen && <Modal title="Create order" description="Add an order to your business records." onClose={() => !isSaving && setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</button><button type="submit" form="order-form" className="dp-primary-button" disabled={isSaving || !lines.length}>{isSaving ? 'Saving…' : 'Create order'} <Plus size={14} /></button></>}>
        <form id="order-form" className="dp-form-grid" onSubmit={createOrder}>
          <FormField label="Customer name"><FieldInput value={form.customer_name} onChange={(event) => updateForm('customer_name', event.target.value)} required /></FormField>
          <FormField label="Phone number"><FieldInput value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} required /></FormField>
          <FormField label="Delivery address" className="dp-form-full"><FieldTextarea rows={2} value={form.address} onChange={(event) => updateForm('address', event.target.value)} required /></FormField>
          <div className="dp-form-full dp-order-line-builder">
            <strong>Order items</strong>
            {catalog.length > 0 && <FormField label="Search catalog / pick a product"><FieldInput list="order-catalog-options" value={itemDraft.name} onChange={(event) => {
              const name = event.target.value;
              const match = catalog.find((product) => product.name === name);
              setItemDraft((c) => ({ ...c, name, product_id: match ? String(match.id || match.product_id) : '', price: match?.price != null ? String(match.price) : c.price }));
            }} placeholder="Choose a product or type a custom item" /><datalist id="order-catalog-options">{catalog.map((product) => <option key={product.id || product.product_id} value={product.name} />)}</datalist></FormField>}
            <div className="dp-order-item-grid"><FormField label="Custom item / product name"><FieldInput value={itemDraft.name} onChange={(event) => setItemDraft((c) => ({ ...c, name: event.target.value, product_id: '' }))} placeholder="Item name" /></FormField><FormField label="Unit price (PKR)"><FieldInput type="number" min="0" step="0.01" value={itemDraft.price} onChange={(event) => setItemDraft((c) => ({ ...c, price: event.target.value }))} /></FormField><FormField label="Quantity"><FieldInput type="number" min="1" step="1" value={itemDraft.quantity} onChange={(event) => setItemDraft((c) => ({ ...c, quantity: event.target.value }))} /></FormField><button type="button" className="dp-secondary-button" onClick={addLine}><Plus size={14} /> Add item</button></div>
            {lines.map((line, index) => <div className="dp-order-item-row" key={`${line.name}-${index}`}><span>{line.name} × {line.quantity}</span><strong>PKR {(line.price * line.quantity).toLocaleString()}</strong><button type="button" className="dp-text-button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>Remove</button></div>)}
          </div>
          <div className="dp-form-full dp-order-calculated-total"><strong>Total</strong><strong>PKR {calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          <FormField label="Notes"><FieldInput value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} /></FormField>
        </form>
      </Modal>}
    </>
  );
}

function CreditIcon(props) { return <ShoppingBag {...props} />; }
