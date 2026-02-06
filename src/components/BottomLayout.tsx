import BottomNav from "@/components/BottomNav";
import FloatingQuickSettings from "./FloatingButton";

function BottomLayout() {
  return (
    <>
      {/* Page content should render before this component; no Outlet in App Router */}
      <BottomNav />
      <div className="lg:hidden">
        <FloatingQuickSettings />
      </div>
    </>
  );
}

export default BottomLayout;
