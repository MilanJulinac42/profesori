import { PageLoading } from "@/components/ui/page-loading";

export default function BillingLoading() {
  return <PageLoading stats={3} rows={6} variant="table" />;
}
