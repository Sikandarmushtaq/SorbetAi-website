import { useState } from 'react';
import { Users } from 'lucide-react';
import { EmptyState, PageHeader, Panel, SearchInput } from '../../../components/dashboard/common/DashboardUI';

export default function CustomersPage() {
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState('All labels');
  const [sort, setSort] = useState('Last contact');
  return <><PageHeader eyebrow="COMMUNICATE" title="Customers" description="View and manage the people who contact your business." /><Panel><div className="dp-toolbar"><SearchInput placeholder="Search customers..." value={query} onChange={(event) => setQuery(event.target.value)} /><select value={label} onChange={(event) => setLabel(event.target.value)}><option>All labels</option><option>New</option><option>VIP</option><option>Regular</option></select><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Last contact</option><option>Name</option><option>Newest first</option></select></div><EmptyState icon={Users} title="No customers yet" description="Everyone who messages your business will be saved here automatically." /></Panel></>;
}
