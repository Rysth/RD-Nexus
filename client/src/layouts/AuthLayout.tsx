import { Link, Outlet } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function AuthLayout() {
  return (
    <div className="grid w-full min-h-screen lg:grid-cols-2">
      {/* Left Side - Branding & Visuals */}
      <div className="relative flex-col hidden h-full p-10 text-white bg-muted dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

        {/* Decorative elements */}
        <div className="absolute rounded-full -top-24 -left-24 h-96 w-96 bg-primary/20 blur-3xl" />
        <div className="absolute right-0 w-64 h-64 rounded-full top-1/2 bg-blue-500/10 blur-3xl" />

        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm">
              <img src={logo} alt="Logo" className="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-tight">MicroBiz</span>
          </Link>
        </div>

        <div className="relative z-20 mt-auto">
          <p className="text-sm text-zinc-400">
            Creado por{" "}
            <a
              href="https://rysthdesign.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:underline underline-offset-4"
            >
              RysthDesign
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-8 bg-background">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] md:w-[420px] lg:w-[450px]">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-6 h-6 brightness-0 invert"
                />
              </div>
              <span className="text-xl font-bold">MicroBiz</span>
            </Link>
          </div>

          <Outlet />

          <div className="mt-6 text-sm text-center text-muted-foreground lg:hidden">
            Creado por{" "}
            <a
              href="https://rysthdesign.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              RysthDesign
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
