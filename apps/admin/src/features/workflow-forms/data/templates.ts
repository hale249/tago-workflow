import { ClipboardList, FileText, Mail, type LucideIcon } from "lucide-react"

import type { FormConfig, FormFieldType, FormType } from "../types/form"

export const FORM_TYPES: { type: FormType; name: string; label: string; description: string; icon: LucideIcon }[] = [
  { type: "BASIC", name: "Form cơ bản", label: "Cơ bản", description: "Thu thập tên và email liên hệ", icon: FileText },
  { type: "SUBSCRIPTION", name: "Form đăng ký", label: "Đăng ký", description: "Cho khách đăng ký nhận tin / ưu đãi", icon: Mail },
  { type: "SURVEY", name: "Form khảo sát", label: "Khảo sát", description: "Câu hỏi lựa chọn để lấy ý kiến", icon: ClipboardList },
]

export const FIELD_TYPES: { type: FormFieldType; label: string }[] = [
  { type: "text", label: "Text (văn bản ngắn)" }, { type: "textarea", label: "Textarea (văn bản dài)" }, { type: "number", label: "Number (số)" },
  { type: "email", label: "Email" }, { type: "date", label: "Date (ngày)" }, { type: "datetime", label: "Datetime (ngày giờ)" },
  { type: "select", label: "Select (danh sách tuỳ chọn)" }, { type: "checkbox", label: "Checkbox" },
]

const contact = [
  { type: "text" as const, label: "Họ tên", name: "fullName", required: true, placeholder: "Tên của bạn" },
  { type: "email" as const, label: "Email", name: "email", required: true, placeholder: "ban@vidu.com" },
]

/** Starting content for each template (our own wording). */
export function templateConfig(t: FormType): FormConfig {
  if (t === "SUBSCRIPTION")
    return {
      title: "Đăng ký nhận tin",
      fields: [...contact, { type: "select", label: "Bạn quan tâm tới", name: "interest", required: true, options: [{ value: "promo", text: "Khuyến mãi" }, { value: "news", text: "Sản phẩm mới" }, { value: "event", text: "Sự kiện" }] }],
      submitButton: { text: "Đăng ký" },
    }
  if (t === "SURVEY")
    return {
      title: "Góp ý về dịch vụ",
      fields: [
        ...contact,
        { type: "select", label: "Mức độ hài lòng", name: "satisfaction", required: true, options: [{ value: "5", text: "Rất hài lòng" }, { value: "4", text: "Hài lòng" }, { value: "3", text: "Bình thường" }, { value: "2", text: "Chưa hài lòng" }] },
        { type: "textarea", label: "Điều chúng tôi nên cải thiện", name: "feedback", placeholder: "Chia sẻ thêm (không bắt buộc)" },
      ],
      submitButton: { text: "Gửi góp ý" },
    }
  return { title: "Liên hệ", fields: [...contact], submitButton: { text: "Gửi" } }
}
