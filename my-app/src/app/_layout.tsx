import { ThemeProvider } from "@/theme/ThemeProvider";
import ParentLayout from "../components/ParentLayout";
export default function RootLayout() {
  return (
    <ThemeProvider>
      <ParentLayout />
    </ThemeProvider>
  );
}
