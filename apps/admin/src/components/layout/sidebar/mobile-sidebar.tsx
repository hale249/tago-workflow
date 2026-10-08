import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet"
import { useUiStore } from "@/stores/ui.store"
import { SidebarContent } from "./sidebar-content"

export function MobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore()

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Main navigation</SheetDescription>
        <SidebarContent collapsed={false} onNavigate={() => setMobileSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
