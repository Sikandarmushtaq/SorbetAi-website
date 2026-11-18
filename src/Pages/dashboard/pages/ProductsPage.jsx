import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileDown, Package, Plus, Upload } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { resourceRequest } from '../../../services/dashboardApi';
import { downloadCsv, parseCsv } from '../../../utils/csv';

const productHeaders = ['Product Name', 'Description', 'Price', 'Stock', 'Category', 'SKU', 'Product Link', 'Visibility', 'Active'];
const emptyForm = { name: '', description: '', price: '', stock: '', category: '', sku: '', link: '', visibility: 'Public' };

function productRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.products || [];
}

function isActive(product) {
  return product.is_active !== false && product.active !== false && String(product.status || '').toLowerCase() !== 'inactive';
}

function productPrice(product) {
  if (product.price === undefined || product.price === null || product.price === '') return '—';
  return `PKR ${Number(product.price).toLocaleString()}`;
}

function productStock(product) {
  if (!Object.prototype.hasOwnProperty.call(product, 'stock')) return '—';
  return product.stock === '' || product.stock === null ? 'Unlimited' : product.stock;
}

// Loads saved catalogue items and sends product changes, image files and CSV imports to the API.
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All Status');
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const csvRef = useRef(null);
  const { showNotice, Notice } = useNotice();

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await resourceRequest('products');
      setProducts(productRecords(response));
    } catch (error) {
      setProducts([]);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);
  const visible = useMemo(() => products.filter((product) =>
    (category === 'All Categories' || product.category === category) &&
    (status === 'All Status' || (status === 'Active' ? isActive(product) : !isActive(product)))
  ), [products, category, status]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveProduct = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      Object.entries({
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price,
        stock: form.stock === '' ? '' : form.stock,
        category: form.category.trim(),
        sku: form.sku.trim(),
        product_link: form.link.trim(),
        price_visibility: form.visibility,
      }).forEach(([key, value]) => payload.append(key, value));
      if (photo) payload.append('image', photo);
      await resourceRequest('products', { method: 'POST', body: payload });
      setForm(emptyForm);
      setPhoto(null);
      setIsOpen(false);
      showNotice('Product saved successfully.');
      await loadProducts();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const exportProducts = () => downloadCsv('bellbee-products.csv', productHeaders, visible.map((item) => [item.name, item.description, item.price, item.stock ?? '', item.category, item.sku, item.product_link || item.link, item.price_visibility || item.visibility, isActive(item) ? 'Yes' : 'No']));

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const records = parseCsv(await file.text());
      const imported = records.map((record) => ({
        name: record['product name'] || record.name || record.title || '',
        description: record.description || '',
        price: record.price || '',
        stock: record.stock || '',
        category: record.category || '',
        sku: record.sku || '',
        product_link: record['product link'] || record.link || '',
        price_visibility: record.visibility || 'Public',
        is_active: String(record.active || 'yes').toLowerCase() !== 'no',
      })).filter((product) => product.name);
      if (!imported.length) throw new Error('No products were imported. Check that your CSV has a Product Name or Name column.');
      await resourceRequest('products', { method: 'POST', action: 'import', body: { products: imported } });
      showNotice(`${imported.length} product${imported.length === 1 ? '' : 's'} imported.`);
      await loadProducts();
    } catch (error) {
      showNotice(error.message || 'The CSV could not be read. Please check the file format.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <PageHeader eyebrow="MANAGE" title="Products" description="Manage the catalog your AI assistant uses to answer product questions and take orders." actions={<><button type="button" className="dp-secondary-button" onClick={() => csvRef.current?.click()} disabled={isImporting}><Upload size={14} /> {isImporting ? 'Importing…' : 'Import CSV'}</button><button type="button" className="dp-secondary-button" onClick={() => downloadCsv('bellbee-products-template.csv', productHeaders)}><FileDown size={14} /> Template CSV</button><button type="button" className="dp-secondary-button" onClick={exportProducts} disabled={!products.length}><Download size={14} /> Export CSV</button><button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add product</button></>} />
      <input ref={csvRef} type="file" accept=".csv,text/csv" className="dp-visually-hidden" onChange={importCsv} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel>
        <div className="dp-toolbar dp-toolbar-between"><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All Categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select></div>
        {isLoading ? <div className="dp-api-empty-state">Loading products…</div> : visible.length ? (
          <div className="dp-data-list"><div className="dp-data-list-heading"><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span></div>
            {visible.map((item) => <div className="dp-data-list-row" key={item.id || item.product_id}><div><strong>{item.name}</strong><small>{item.sku || ''}</small></div><span>{item.category || '—'}</span><span>{productPrice(item)}</span><span>{productStock(item)}</span><span className={`dp-status-pill ${isActive(item) ? 'success' : 'neutral'}`}>{isActive(item) ? 'Active' : 'Inactive'}</span></div>)}
          </div>
        ) : loadError ? <div className="dp-api-empty-state"><Package size={22} /><strong>Products are ready to connect</strong><p>Connect the products API to load and manage your saved catalogue.</p></div> : <EmptyState icon={Package} title="No products yet" description="Add your first product so the AI can show it to customers on WhatsApp." buttonText="Add your first product" onAction={() => setIsOpen(true)} />}
      </Panel>

      {isOpen && <Modal title="Add product" description="Add details your AI can use when customers ask about your products." onClose={() => !isSaving && setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</button><button type="submit" form="product-form" className="dp-primary-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save product'} <Plus size={14} /></button></>}>
        <form id="product-form" className="dp-form-grid" onSubmit={saveProduct}>
          <FormField label="Product photo" className="dp-form-full" hint="JPG, PNG or WEBP. Maximum 5 MB."><FieldInput type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { showNotice('Choose a JPG, PNG or WEBP image up to 5 MB.'); event.target.value = ''; return; } setPhoto(file); }} /></FormField>
          <FormField label="Product name"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value)} required maxLength={160} /></FormField>
          <FormField label="Price (PKR)"><FieldInput type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} required /></FormField>
          <FormField label="Description" className="dp-form-full"><FieldTextarea rows={3} maxLength={2000} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe your product..." /><small>{form.description.length}/2000 characters</small></FormField>
          <FormField label="Stock" hint="Leave blank for unlimited stock."><FieldInput type="number" min="0" value={form.stock} onChange={(event) => update('stock', event.target.value)} /></FormField>
          <FormField label="Category"><FieldInput value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="e.g. Clothing" /></FormField>
          <FormField label="SKU"><FieldInput value={form.sku} onChange={(event) => update('sku', event.target.value)} /></FormField>
          <FormField label="Product link (optional)"><FieldInput type="url" value={form.link} onChange={(event) => update('link', event.target.value)} placeholder="https://" /></FormField>
          <FormField label="Price visibility"><FieldSelect value={form.visibility} onChange={(event) => update('visibility', event.target.value)}><option>Public</option><option>Ask first</option><option>Private</option></FieldSelect></FormField>
        </form>
      </Modal>}
    </>
  );
}
