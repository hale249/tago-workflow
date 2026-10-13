import type { IconSvgElement } from "@hugeicons/react"
import {
  Alert01Icon,
  AlertCircleIcon,
  Calendar01Icon,
  SecurityCheckIcon,
  StarIcon,
  TableIcon,
  Store01Icon,
  Mail01Icon,
  Invoice01Icon,
  GoogleIcon,
  DeliveryTruck01Icon,
  CheckmarkCircle01Icon,
  CircleIcon,
  AiBrain01Icon,
  ArrowDown01Icon,
  ArrowDataTransferHorizontalIcon,
  BubbleChatIcon,
  Briefcase01Icon,
  ChartGanttIcon,
  CircleQuestionMarkIcon,
  DatabaseIcon,
  Dollar01Icon,
  Facebook01Icon,
  File02Icon,
  FilterIcon,
  FlashIcon,
  FolderKanbanIcon,
  Grid2x2Icon,
  Home01Icon,
  InstagramIcon,
  Layout3ColumnIcon,
  LayoutGridIcon,
  LinkIcon,
  ListViewIcon,
  Message01Icon,
  Moon02Icon,
  Notification01Icon,
  Package01Icon,
  PanelLeftCloseIcon,
  Search01Icon,
  Settings01Icon,
  Shield01Icon,
  Sun01Icon,
  TablePropertiesIcon,
  Tick02Icon,
  Target01Icon,
  UserMultipleIcon,
  WorkflowCircle01Icon,
} from "@hugeicons/core-free-icons"

/** Icon data rendered with `<HugeiconsIcon icon={…} />` (the reference UI's set: stroke-rounded, 1.5px). */
export type AppIcon = IconSvgElement

// Header + sidebar chrome
export const SidebarToggleIcon = PanelLeftCloseIcon
export const LightModeIcon = Sun01Icon
export const DarkModeIcon = Moon02Icon
export const SearchIcon = Search01Icon
export const CheckIcon = Tick02Icon

// Main sidebar
export const SectionChevronIcon = ArrowDown01Icon
export const HomeNavIcon = Home01Icon
export const NotificationNavIcon = Notification01Icon
export const AppsNavIcon = LayoutGridIcon
export const WorkGroupIcon = FolderKanbanIcon
export const WorkflowNavIcon = WorkflowCircle01Icon
export const FormNavIcon = File02Icon
export const ConnectorNavIcon = LinkIcon
export const FacebookNavIcon = Facebook01Icon
export const InstagramNavIcon = InstagramIcon
export const WhatsAppNavIcon = BubbleChatIcon
export const ZaloNavIcon = Message01Icon
export const SettingsNavIcon = Settings01Icon
export const HelpNavIcon = CircleQuestionMarkIcon

// Table settings nav
export const FieldsIcon = TablePropertiesIcon
export const ActionsIcon = FlashIcon
export const PermissionsIcon = Shield01Icon
export const ListLayoutIcon = ListViewIcon
export const FiltersIcon = FilterIcon
export const DetailIcon = File02Icon
export const KanbanIcon = Layout3ColumnIcon
export const GanttIcon = ChartGanttIcon
export const PivotIcon = Grid2x2Icon
export const ObjectiveIcon = Target01Icon
export const ConversionIcon = ArrowDataTransferHorizontalIcon
export const DangerIcon = Alert01Icon

/** Per-table icons (id stored on the table → glyph), same set as the reference's table icon picker. */
export const TABLE_ICONS: { id: string; label: string; icon: AppIcon }[] = [
  { id: "table", label: "Bảng", icon: FieldsIcon },
  { id: "document", label: "Tài liệu", icon: File02Icon },
  { id: "users", label: "Người", icon: UserMultipleIcon },
  { id: "dollar", label: "Tiền", icon: Dollar01Icon },
  { id: "check-square", label: "Công việc", icon: Briefcase01Icon },
  { id: "database", label: "Kho dữ liệu", icon: DatabaseIcon },
  { id: "list", label: "Danh sách", icon: ListLayoutIcon },
  { id: "package", label: "Hàng hoá", icon: Package01Icon },
]

/** Connector type → glyph + tinted tile (reference: Bảng = purple table tile). */
export const CONNECTOR_ICONS: Record<string, { icon: AppIcon; tile: string }> = {
  ACTIVE_TABLE: { icon: TableIcon, tile: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" },
  AI_PROVIDER: { icon: AiBrain01Icon, tile: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" },
  SMTP: { icon: Mail01Icon, tile: "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400" },
  Facebook: { icon: FacebookNavIcon, tile: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  INSTAGRAM_CHAT: { icon: InstagramNavIcon, tile: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400" },
  WHATSAPP_CHAT: { icon: WhatsAppNavIcon, tile: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
  ZALO_OA: { icon: ZaloNavIcon, tile: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  Google: { icon: GoogleIcon, tile: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
  "Bán hàng": { icon: Store01Icon, tile: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400" },
  "Vận chuyển": { icon: DeliveryTruck01Icon, tile: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  "Kế toán": { icon: Invoice01Icon, tile: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400" },
}
export const ConnectedIcon = CheckmarkCircle01Icon
export const DisconnectedIcon = CircleIcon
export const ConnectorErrorIcon = AlertCircleIcon
export const WorkflowUnitIcon = Package01Icon
export const StarOutlineIcon = StarIcon
export const OwnerIcon = SecurityCheckIcon
export const CalendarSmallIcon = Calendar01Icon
export const PeopleIcon = UserMultipleIcon
