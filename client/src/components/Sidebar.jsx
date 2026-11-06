
import { useEffect, useState } from "react";

const navItems = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "issues", label: "Issue Explorer", icon: "☷" },
  { id: "analytics", label: "Analytics", icon: "▥" },
];

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState(
    () => window.location.hash.slice(1) || "overview"
  );

  useEffect(() => {
    const sectionIds = ["overview", "issues", "analytics"];

    const handleScroll = () => {
      const marker = window.innerHeight * 0.3;
      let currentSection = "overview";

      for (const id of sectionIds) {
        const section = document.getElementById(id);

        if (section && section.getBoundingClientRect().top <= marker) {
          currentSection = id;
        }
      }

      setActiveSection(currentSection);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      if (sectionIds.includes(hash)) {
        setActiveSection(hash);
      }

      handleScroll();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-800 bg-[#0b1120] px-5 py-7 md:flex">
      <div className="mb-12 flex items-center gap-3">
        <img
          src="/issuewise-icon.svg"
          alt="IssueWise Logo"
          className="size-16 shrink-0 rounded-xl object-contain"
        />

        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            IssueWise
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Issue intelligence
          </p>
        </div>
      </div>

      <p className="mb-3 px-2 text-[10px] font-bold tracking-[0.18em] text-slate-500">
        WORKSPACE
      </p>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              aria-current={isActive ? "location" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive
                  ? "bg-indigo-500/10 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-slate-800 pt-5 text-xs text-slate-400">
        <span className="size-2 rounded-full bg-emerald-400" />
        IssueWise API
        <span className="ml-auto text-slate-600">Local</span>
      </div>
    </aside>
  );
}
