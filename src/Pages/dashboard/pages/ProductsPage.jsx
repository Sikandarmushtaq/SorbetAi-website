import { useRef, useState } from 'react';
import { Package, Plus, Upload, Download, FileDown } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { downloadCsv, parseCsv } from '../../../utils/csv';

const productHeaders = ['Product Name', 'Description', 'Price', 'Stock', 'Category', 'SKU', 'Product Link', 'Visibility', 'Active'];

// Manages local product entries and browser-based CSV template/export actions.
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All Status');
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', sku: '', link: '', visibility: 'Public' });
  const fileRef = useRef(null);
  const { showNotice, Notice } = useNotice();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setProducts((current) => [{ ...form, id: Date.now(), active: true }, ...current]);
    setForm({ name: '', description: '', price: '', stock: '', category: '', sku: '', link: '', visibility: 'Public' });
    setIsOpen(false);
    showNotice('Product added to this local preview. Persistent storage will be enabled with the backend.');
  };
  const visible = products.filter((product) => (category === 'All Categories' || product.category === category) && (status === 'All Status' || (status === 'Active' ? product.active : !product.active)));
  const exportProducts = () => downloadCsv('bellbee-products.csv', productHeaders, products.map((item) => [item.name, item.description, item.price, item.stock, item.category, item.sku, item.link, item.visibility, item.active ? 'Yes' : 'No']));
  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const records = parseCsv(await file.text());
      const imported = records.map((record, index) => ({
        id: Date.now() + index,
        name: record['product name'] || record.name || record.title || '',
        description: record.description || '',
        price: record.price || '',
        stock: record.stock || '',
        category: record.category || '',
        sku: record.sku || '',
        link: record['product link'] || record.link || '',
        visibility: record.visibility || 'Public',
        active: String(record.active || 'yes').toLowerCase() !== 'no',
      })).filter((product) => product.name);
      if (!imported.length) {
        showNotice('No products were imported. Check that your CSV has a Product Name or Name column.');
      } else {
        setProducts((current) => [...imported, ...current]);
        showNotice(`${imported.length} product${imported.length === 1 ? '' : 's'} imported into this local preview.`);
      }
    } catch {
      showNotice('The CSV could not be read. Please check the file format and try again.');
    } finally {
      event.target.value = '';
    }
  };
  return <>
    <PageHeader eyebrow="MANAGE" title="Products" description="Manage the catalog your AI assistant uses to answer product questions and take orders." actions={<><button type="button" className="dp-secondary-button" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import CSV</button><button type="button" className="dp-secondary-button" onClick={() => downloadCsv('bellbee-products-template.csv', productHeaders)}><FileDown size={14} /> Template CSV</button><button type="button" className="dp-secondary-button" onClick={exportProducts}><Download size={14} /> Export CSV</button><button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add product</button></>} />
    <input ref={fileRef} type="file" accept=".csv,text/csv" className="dp-visually-hidden" onChange={importCsv} />{Notice}
    <Panel><div className="dp-toolbar"><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All Categories</option><option>Food</option><option>Clothing</option><option>Other</option></select><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select></div>
      {visible.length ? <div className="dp-data-list"><div className="dp-data-list-heading"><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span></div>{visible.map((item) => <div className="dp-data-list-row" key={item.id}><strong>{item.name}</strong><span>{item.category || '—'}</span><span>PKR {Number(item.price || 0).toLocaleString()}</span><span>{item.stock || 'Unlimited'}</span><span className="dp-status-pill success">Active</span></div>)}</div> : <EmptyState icon={Package} title="No products yet" description="Add your first product so the AI can show it to customers on WhatsApp." buttonText="Add your first product" onAction={() => setIsOpen(true)} />}
    </Panel>
    {isOpen && <Modal title="Add product" description="Add details your AI can use when customers ask about your products." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="product-form" className="dp-primary-button">Save product <Plus size={14} /></button></>}>
      <form id="product-form" className="dp-form-grid" onSubmit={submit}>
        <FormField label="Product photo" className="dp-form-full" hint="JPG, PNG or WEBP. Maximum 5 MB. Upload storage will be connected later."><FieldInput type="file" accept="image/jpeg,image/png,image/webp" /></FormField>
        <FormField label="Product name"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value)} required /></FormField>
        <FormField label="Price (PKR)"><FieldInput type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} required /></FormField>
        <FormField label="Description" className="dp-form-full"><FieldTextarea rows={3} maxLength={2000} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe your product..." /><small>{form.description.length}/2000 characters</small></FormField>
        <FormField label="Stock" hint="Leave blank for unlimited stock."><FieldInput type="number" min="0" value={form.stock} onChange={(event) => update('stock', event.target.value)} /></FormField>
        <FormField label="Category"><FieldInput value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="e.g. Clothing" /></FormField>
        <FormField label="SKU"><FieldInput value={form.sku} onChange={(event) => update('sku', event.target.value)} /></FormField>
        <FormField label="Product link (optional)"><FieldInput type="url" value={form.link} onChange={(event) => update('link', event.target.value)} placeholder="https://" /></FormField>
        <FormField label="Price visibility"><FieldSelect value={form.visibility} onChange={(event) => update('visibility', event.target.value)}><option>Public</option><option>Ask first</option><option>Private</option></FieldSelect></FormField>
      </form>
    </Modal>}
  </>;
}
