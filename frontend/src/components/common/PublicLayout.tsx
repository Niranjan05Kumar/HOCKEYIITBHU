import { Outlet } from "react-router-dom";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F4F1EA] text-[#1A1A1A] font-sans antialiased selection:bg-[#5A181E] selection:text-[#F4F1EA]">
            <Header />
            <div className="flex-grow flex flex-col">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}
