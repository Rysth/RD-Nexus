import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/index";
import { useState, useEffect } from "react";
import { useDocumentTitle } from "./hooks/useDocumentTitle";

function App() {
  const [isMobile, setIsMobile] = useState(false);

  // Initialize document title with business data
  useDocumentTitle();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <>
      <AppRoutes />
      <Toaster
        position={isMobile ? "bottom-center" : "bottom-right"}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            marginBottom: isMobile ? "80px" : "20px", // Account for bottom nav on mobile
          },
          success: {
            icon: "✅",
          },
        }}
      />
    </>
  );
}

export default App;
