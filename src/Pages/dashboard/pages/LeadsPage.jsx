import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  Tabs,
} from "../../../components/dashboard/common/DashboardUI";
import { useState } from "react";

export default function LeadsPage() {
  const [tab, setTab] = useState("New");
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="COMMUNICATE"
        title="Leads"
        description="Enquiries your AI collected for you to follow up."
      />
      <Panel>
        <Tabs
          items={["New", "Contacted", "Won", "Lost", "In progress"]}
          active={tab}
          onChange={setTab}
        />
        <EmptyState
          icon={Users}
          title="Tell your AI what to collect"
          description="Choose the enquiry details you want to follow up personally. Your AI can collect them and add a lead here."
          buttonText="Set up lead collection"
          onAction={() => navigate("/dashboard/request")}
        />
      </Panel>
    </>
  );
}
