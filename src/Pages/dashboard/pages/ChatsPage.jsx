import { useState } from "react";
import { Filter, MessageCircle } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  SearchInput,
} from "../../../components/dashboard/common/DashboardUI";

// Displays channel and conversation filters with a separate conversation preview area.
export default function ChatsPage() {
  const [tab, setTab] = useState("All");
  const [channel, setChannel] = useState("WhatsApp");
  const [query, setQuery] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="COMMUNICATE"
        title="Chats"
        description="Manage customer conversations from your connected channels."
        actions={<span className="dp-count-badge">0 total</span>}
      />
      <section className="dp-chat-layout">
        <div className="dp-chat-list">
          <div className="dp-chat-list-top">
            <SearchInput
              placeholder="Search conversations..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="dp-icon-action" title="Filters">
              <Filter size={16} />
            </button>
          </div>
          <div className="dp-tabs">
            {["All", "Unread", "Assigned"].map((item) => (
              <button
                type="button"
                key={item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="dp-chat-channels">
            {["WhatsApp", "Website Chat"].map((item) => (
              <button
                type="button"
                key={item}
                className={channel === item ? "active" : ""}
                onClick={() => setChannel(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <EmptyState
            icon={MessageCircle}
            title="No chats yet"
            description="Customer chats from your connected channels will show up here."
          />
        </div>
        <div className="dp-chat-conversation">
          <div className="dp-chat-placeholder">
            <div className="dp-empty-icon">
              <MessageCircle size={27} />
            </div>
            <h3>Select a conversation</h3>
            <p>Pick a chat from the list to start replying.</p>
          </div>
        </div>
      </section>
    </>
  );
}
