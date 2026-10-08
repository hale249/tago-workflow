import { useParams } from "react-router"

import { RecordDetailView } from "../components/record-detail-view"

export function RecordDetailPage() {
  const { tableId = "", recordId = "" } = useParams()
  return <RecordDetailView tableId={tableId} recordId={recordId} mode="page" />
}
