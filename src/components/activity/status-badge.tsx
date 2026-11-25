import { CheckCircle2, Clock3, XCircle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RequestStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="warning"><Clock3 /> Pending</Badge>;
    case "accepted":
      return <Badge variant="success"><CheckCircle2 /> Accepted</Badge>;
    case "declined":
      return <Badge variant="destructive"><XCircle /> Declined</Badge>;
    default:
      return <Badge variant="muted"><Ban /> Cancelled</Badge>;
  }
}
