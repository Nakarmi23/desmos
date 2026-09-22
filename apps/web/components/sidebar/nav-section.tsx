"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import type { NavItem, NavSection } from "@/components/nav/nav-items";

import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

function NavRow({
  item,
  activeHref,
}: {
  item: NavItem;
  activeHref: string | undefined;
}) {
  const active = item.href === activeHref;

  return (
    <Link
      href={item.href}
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={styles.navLink()}
    >
      <div aria-hidden className={styles.navIconGlyph()}>
        {item.icon}
      </div>
      <span className={styles.navLabelText()}>{item.label}</span>
    </Link>
  );
}

/** A plain section heading followed by its rows — no collapse, no search. */
function StaticNavSection({
  section,
  activeHref,
}: {
  section: NavSection;
  activeHref: string | undefined;
}) {
  return (
    <div className={styles.navSection()}>
      <span className={styles.navSectionStaticLabel()}>
        <span className={styles.navSectionLabel()}>{section.label}</span>
      </span>
      {section.items.map((item) => (
        <NavRow key={item.href} item={item} activeHref={activeHref} />
      ))}
    </div>
  );
}

/**
 * A section that can grow long (one row per DB table, eventually) — its
 * header toggles the row list. The header is hidden in the icon rail
 * (`sidebarStyles`'s `group-data-[closed]:hidden`) since there's no room to
 * interact with it there; collapsing the section still hides its rows in the
 * rail too, same as at full width.
 */
function CollapsibleNavSection({
  section,
  activeHref,
}: {
  section: NavSection;
  activeHref: string | undefined;
}) {
  const [expanded, setExpanded] = useState(true);
  const panelId = `nav-section-${section.id}`;

  return (
    <div className={styles.navSection()}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((prev) => !prev)}
        className={styles.navSectionHeader()}
      >
        <span className={styles.navSectionLabel()}>{section.label}</span>
        <ChevronRight
          aria-hidden
          data-expanded={expanded || undefined}
          className={styles.navSectionChevron()}
        />
      </button>

      {expanded && (
        <div id={panelId} className={styles.navSection()}>
          {section.items.map((item) => (
            <NavRow key={item.href} item={item} activeHref={activeHref} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavSectionGroup({
  section,
  activeHref,
}: {
  section: NavSection;
  activeHref: string | undefined;
}) {
  if (section.collapsible) {
    return <CollapsibleNavSection section={section} activeHref={activeHref} />;
  }

  return <StaticNavSection section={section} activeHref={activeHref} />;
}
