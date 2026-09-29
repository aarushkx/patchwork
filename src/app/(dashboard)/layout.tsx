import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Header from "@/components/custom/header";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        redirect("/signin");
    }
    return (
        <div className="min-h-screen bg-background">
            <Header user={session.user} />
            <main className="container m-auto px-4 py-8">{children}</main>
        </div>
    );
};

export default DashboardLayout;
