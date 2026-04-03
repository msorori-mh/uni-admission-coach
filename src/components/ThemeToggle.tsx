import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = ({ variant = "header" }: { variant?: "header" | "default" }) => {
  const { theme, setTheme } = useTheme();

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  if (variant === "header") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        className="text-white hover:bg-white/20 hover:text-white"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
};

export default ThemeToggle;
