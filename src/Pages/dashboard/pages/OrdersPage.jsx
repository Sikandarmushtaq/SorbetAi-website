import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Download, Plus, RefreshCw, Search, ShoppingBag, Truck } from 'lucide-react';
import { ordersApi } from '../../../services/dashboard/orders.api.js';
import { productsApi } from '../../../services/dashboard/products.api.js';
import {
  EmptyState, FieldInput, FieldTextarea, FormField, Modal,
  PageHeader, Panel, StatCard, StatGrid, Tabs,
} from '../../../components/dashboard/common/DashboardUI';
import { useDashboardToast } from '../../../components/dashboard/common/DashboardToastProvider';
import { getDashboardFormErrors } from '../../../components/dashboard/common/dashboardFormErrors';
import { downloadCsv } from '../../../utils/csv';
import './OrdersPage.css';

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
const emptyItem = { product_id: '', name: '', price: '', quantity: 1 };
const csvHeaders = ['Customer', 'Items', 'Total', 'Status', 'Date'];

function orderRecords(response) {
  const records = Array.isArray(response) ? response : response?.items || response?.results || response?.orders || [];
  return Array.isArray(records) ? records : [];
}

function orderId(order) {
  return String(order.id || order.order_id || order.order_number || '');
}

function orderCustomer(order) {
  return order.customer_name || order.customer?.full_name || order.customer?.name || order.customer || 'Customer';
}

function orderItems(order) {
  if (Array.isArray(order.items)) {
    return order.items.map((item) => `${item.name || item.product_name || 'Item'}${item.quantity ? ` × ${item.quantity}` : ''}`).join(', ');
  }
  return order.items || order.item_summary || order.item || '—';
}

function orderStatus(order) {
  return String(order.status || 'pending').toLowerCase().replaceAll(' ', '_');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDashboardToast();

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [lines, setLines] = useState([]);
  const [itemDraft, setItemDraft] = useState(emptyItem);
  const [lineError, setLineError] = useState('');

  const requestedStatus = searchParams.get('status') || 'all';
  const activeStatus = orderStatuses.some((item) => item.value === requestedStatus) ? requestedStatus : 'all';
  const query = searchParams.get('q') || '';

  const loadOrders = useCallback(async ({ notify = false } = {}) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await ordersApi.request();
      setOrders(orderRecords(response));
      setSummary(response?.summary || response?.metrics || null);
      if (notify) toast.success('Orders refreshed', 'Latest order records were loaded.');
    } catch (error) {
      const message = error?.message || 'Could not load orders.';
      setLoadError(message);
      if (notify) toast.error('Could not refresh orders', message);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!isOpen || !productsApi.isConfigured()) return undefined;
    let active = true;
    productsApi.request().then((response) => {
      if (active) setCatalog(Array.isArray(response) ? response : response?.items || response?.products || response?.results || []);
    }).catch((error) => {
      if (active) toast.warning('Product catalogue unavailable', error?.message || 'You can still enter custom order items.');
    });
    return () => { active = false; };
  }, [isOpen, toast]);

  const visibleOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...orders]
      .filter((order) => activeStatus === 'all' || orderStatus(order) === activeStatus)
      .filter((order) => !needle || orderCustomer(order).toLowerCase().includes(needle) || String(order.phone || order.customer?.phone || '').toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.created_at || b.date || b.order_date || 0) - new Date(a.created_at || a.date || a.order_date || 0));
  }, [orders, activeStatus, query]);

  const todayKey = localDateKey(new Date());
  const todayRevenue = summary?.revenue_today ?? summary?.today_revenue ?? orders
    .filter((order) => localDateKey(order.created_at || order.date || order.order_date) === todayKey)
    .reduce((total, order) => total + Number(order.total || order.total_amount || order.amount || 0), 0);
  const pendingCount = summary?.pending_count ?? orders.filter((order) => orderStatus(order) === 'pending').length;
  const shippingCount = summary?.shipping_count ?? orders.filter((order) => ['processing', 'shipped'].includes(orderStatus(order))).length;
  const deliveredCount = summary?.delivered_count ?? orders.filter((order) => orderStatus(order) === 'delivered').length;
  const calculatedTotal = lines.reduce((sum, line) => sum + Number(line.price) * Number(line.quantity), 0);

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

  const openEditor = () => {
    setFieldErrors({});
    setFormError('');
    setLineError('');
    setIsOpen(true);
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
    setFormError('');
  };

  const addLine = () => {
    const quantity = Number(itemDraft.quantity);
    const price = Number(itemDraft.price);
    if (!itemDraft.name.trim() || itemDraft.price === '' || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) {
      setLineError('Enter an item name, valid price and whole-number quantity of at least one.');
      toast.warning('Check order item', 'Correct the highlighted order-item fields.');
      return;
    }
    setLines((current) => [...current, { ...itemDraft, name: itemDraft.name.trim(), price, quantity }]);
    setItemDraft(emptyItem);
    setLineError('');
    setFieldErrors((current) => ({ ...current, items: '' }));
  };

  const createOrder = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const errors = {};
    if (!form.customer_name.trim()) errors.customer_name = 'Customer name is required.';
    if (!form.phone.trim()) errors.phone = 'Phone number is required.';
    if (!form.address.trim()) errors.delivery_address = 'Delivery address is required.';
    if (!lines.length) errors.items = 'Add at least one order item.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      toast.warning('Order form needs attention', 'Please correct the fields inside the popup.');
      return;
    }

    setFieldErrors({});
    setFormError('');
    setIsSaving(true);
    const pendingId = toast.loading('Creating order', 'Sending your order to the backend…');

    try {
      await ordersApi.request({
        method: 'POST',
        body: {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          delivery_address: form.address.trim(),
          items_description: lines.map((line) => `${line.name} x ${line.quantity}`).join(', '),
          items: lines.map((line) => ({
            ...(line.product_id ? { product_id: line.product_id } : {}),
            name: line.name, quantity: line.quantity, unit_price: line.price,
          })),
          notes: form.notes.trim(),
          total: calculatedTotal,
          currency: 'PKR',
        },
      });
      setForm(emptyForm);
      setLines([]);
      setIsOpen(false);
      toast.update(pendingId, 'success', 'Order created', 'The backend saved your order.');
      await loadOrders();
    } catch (error) {
      const parsed = getDashboardFormErrors(error, { delivery_address: 'delivery_address', items_description: 'items' });
      setFieldErrors(parsed.fields);
      setFormError(parsed.summary);
      toast.update(pendingId, 'error', 'Order could not be saved', 'Review the details in the order popup.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateOrderStatus = async (order, nextStatus) => {
    const id = orderId(order);
    if (!id || statusUpdatingId || nextStatus === orderStatus(order)) return;
    setStatusUpdatingId(id);
    const pendingId = toast.loading('Updating order', `Changing status to ${nextStatus}…`);
    try {
      await ordersApi.request({ method: 'PATCH', id, body: { status: nextStatus } });
      setOrders((current) => current.map((item) => orderId(item) === id ? { ...item, status: nextStatus } : item));
      toast.update(pendingId, 'success', 'Order status updated', `Status changed to ${nextStatus}.`);
    } catch (error) {
      toast.update(pendingId, 'error', 'Status update failed', error?.message || 'Please try again.');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const orderTotal = (order) => {
    const value = order.total ?? order.total_amount ?? order.amount;
    return value === undefined || value === null || value === '' ? '—' : `PKR ${Number(value).toLocaleString()}`;
  };
  const statusLabel = (value) => orderStatuses.find((item) => item.value === value)?.label || value;
  const exportOrders = () => downloadCsv('bellbee-orders.csv', csvHeaders, visibleOrders.map((order) => [
    orderCustomer(order), orderItems(order), order.total ?? order.total_amount ?? order.amount ?? '',
    orderStatus(order), order.created_at || order.date || order.order_date || '',
  ]));

  return (
    <div className="bb-orders-premium">
      <PageHeader
        eyebrow="YOUR BUSINESS SALES"
        title="Orders"
        description="Follow every sale from the first request to delivery."
        actions={<>
          <button type="button" className="dp-secondary-button" onClick={() => loadOrders({ notify: true })} disabled={isLoading}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="dp-secondary-button" onClick={exportOrders} disabled={!visibleOrders.length}><Download size={14} /> Export</button>
          <button type="button" className="dp-primary-button" onClick={openEditor}><Plus size={15} /> Create Order</button>
        </>}
      />
      {loadError && <div className="dp-inline-notice dp-api-error" role="alert">{loadError}</div>}
      <StatGrid columns={4}>
        <StatCard label="Revenue Today" value={isLoading ? '—' : `PKR ${Number(todayRevenue || 0).toLocaleString()}`} icon={ShoppingBag} />
        <StatCard label="Pending" value={isLoading ? '—' : Number(pendingCount || 0)} icon={Clock3} accent="yellow" />
        <StatCard label="Shipping" value={isLoading ? '—' : Number(shippingCount || 0)} icon={Truck} accent="lavender" />
        <StatCard label="Delivered" value={isLoading ? '—' : Number(deliveredCount || 0)} icon={CheckCircle2} accent="green" />
      </StatGrid>
      <Panel className="dp-orders-panel">
        <div className="bb-orders-section-heading"><div><span>ORDER ACTIVITY</span><h2>Latest customer orders</h2></div><span>{visibleOrders.length} orders</span></div>
        <label className="dp-search-input dp-orders-search"><Search size={16} /><input type="search" value={query} onChange={(event) => updateParam('q', event.target.value)} placeholder="Search customer name or phone…" /></label>
        <Tabs items={orderStatuses.map((item) => item.label)} active={statusLabel(activeStatus)} onChange={(label) => updateParam('status', orderStatuses.find((item) => item.label === label)?.value || 'all')} />
        {isLoading && !orders.length ? <div className="dp-api-empty-state">Loading orders…</div> : visibleOrders.length ? (
          <div className="bb-orders-table-scroll"><div className="dp-data-list dp-orders-table">
            <div className="dp-data-list-heading"><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span>Date</span><span>Actions</span></div>
            {visibleOrders.map((order) => {
              const id = orderId(order);
              const status = orderStatus(order);
              return (
                <div className="dp-data-list-row" key={id}>
                  <div><strong>{orderCustomer(order)}</strong><small>{order.phone || order.customer?.phone || ''}</small></div>
                  <span>{orderItems(order)}</span>
                  <strong>{orderTotal(order)}</strong>
                  <span className={`dp-status-pill ${status === 'delivered' ? 'success' : status === 'cancelled' ? 'danger' : status === 'shipped' ? 'info' : 'warning'}`}>{statusLabel(status)}</span>
                  <time>{formatDate(order.created_at || order.date || order.order_date)}</time>
                  <select aria-label={`Change status for ${orderCustomer(order)}`} value={status} disabled={Boolean(statusUpdatingId)} onChange={(event) => updateOrderStatus(order, event.target.value)}>
                    {orderStatuses.filter((item) => item.value !== 'all').map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div></div>
        ) : loadError ? <div className="dp-api-empty-state"><ShoppingBag size={22} /><strong>Orders couldn't be loaded</strong><p>Check your connection and refresh.</p></div>
          : query || activeStatus !== 'all' ? <EmptyState icon={Search} title="No matching orders" description="Try changing the search or status filter." buttonText="Clear filters" onAction={clearFilters} />
            : <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders placed in chat will appear here. You can also create one manually." buttonText="Add order" onAction={openEditor} />}
      </Panel>

      {isOpen && (
        <Modal title="Create order" description="Add an order to your business records." error={formError} onClose={() => { if (!isSaving) setIsOpen(false); }} footer={<>
          <button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</button>
          <button type="submit" form="order-form" className="dp-primary-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Create order'} <Plus size={14} /></button>
        </>}>
          <form id="order-form" className="dp-form-grid" noValidate onSubmit={createOrder}>
            <FormField label="Customer name" error={fieldErrors.customer_name}><FieldInput required value={form.customer_name} aria-invalid={Boolean(fieldErrors.customer_name)} onChange={(event) => updateForm('customer_name', event.target.value)} /></FormField>
            <FormField label="Phone number" error={fieldErrors.phone}><FieldInput required value={form.phone} aria-invalid={Boolean(fieldErrors.phone)} onChange={(event) => updateForm('phone', event.target.value)} /></FormField>
            <FormField label="Delivery address" className="dp-form-full" error={fieldErrors.delivery_address}><FieldTextarea required rows={2} value={form.address} aria-invalid={Boolean(fieldErrors.delivery_address)} onChange={(event) => updateForm('address', event.target.value)} /></FormField>
            <div className="dp-form-full dp-order-line-builder">
              <strong>Order items</strong>
              {catalog.length > 0 && (
                <FormField label="Search catalogue / choose a product"><FieldInput list="order-catalog-options" value={itemDraft.name} placeholder="Choose a product or type custom item" onChange={(event) => {
                  const name = event.target.value;
                  const match = catalog.find((product) => product.name === name);
                  setItemDraft((current) => ({ ...current, name, product_id: match ? String(match.id || match.product_id) : '', price: match?.price != null ? String(match.price) : current.price }));
                }} /><datalist id="order-catalog-options">{catalog.map((product) => <option key={product.id || product.product_id} value={product.name} />)}</datalist></FormField>
              )}
              <div className="dp-order-item-grid">
                <FormField label="Custom item / product name"><FieldInput value={itemDraft.name} placeholder="Item name" onChange={(event) => { setItemDraft((current) => ({ ...current, name: event.target.value, product_id: '' })); setLineError(''); }} /></FormField>
                <FormField label="Unit price (PKR)"><FieldInput type="number" min="0" step="0.01" value={itemDraft.price} onChange={(event) => { setItemDraft((current) => ({ ...current, price: event.target.value })); setLineError(''); }} /></FormField>
                <FormField label="Quantity"><FieldInput type="number" min="1" step="1" value={itemDraft.quantity} onChange={(event) => { setItemDraft((current) => ({ ...current, quantity: event.target.value })); setLineError(''); }} /></FormField>
                <button type="button" className="dp-secondary-button" onClick={addLine}><Plus size={14} /> Add item</button>
              </div>
              {(lineError || fieldErrors.items) && <small className="dp-field-error" role="alert">{lineError || fieldErrors.items}</small>}
              {lines.map((line, index) => <div className="dp-order-item-row" key={`${line.name}-${index}`}><span>{line.name} × {line.quantity}</span><strong>PKR {(line.price * line.quantity).toLocaleString()}</strong><button type="button" className="dp-text-button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>Remove</button></div>)}
            </div>
            <div className="dp-form-full dp-order-calculated-total"><strong>Total</strong><strong>PKR {calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
            <FormField label="Notes" error={fieldErrors.notes}><FieldInput value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} /></FormField>
          </form>
        </Modal>
      )}
    </div>
  );
}