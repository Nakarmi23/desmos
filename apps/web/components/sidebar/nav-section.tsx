"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import type { NavItem, NavSection } from "@/components/nav/nav-items";

import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

/**
 * `showTooltip` is on only in the icon rail, where the label is hidden —
 * the tooltip names the row instead. `disabled` (rather than conditionally
 * wrapping) keeps the row's element stable across collapse/expand.
 */
function NavRow({
  item,
  activeHref,
  showTooltip,
}: {
  item: NavItem;
  activeHref: string | undefined;
  showTooltip: boolean;
}) {
  const active = item.href === activeHref;

  return (
    <Tooltip.Root disabled={!showTooltip}>
      <Tooltip.Trigger
        delay={0}
        render={
          <Link
            href={item.href}
            data-active={active || undefined}
            aria-current={active ? "page" : undefined}
            className={styles.navLink()}
          />
        }
      >
        <div aria-hidden className={styles.navIconGlyph()}>
          {item.icon}
        </div>
        <span className={styles.navLabelText()}>{item.label}</span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner
          side="right"
          sideOffset={12}
          className={styles.navTooltipPositioner()}
        >
          <Tooltip.Popup className={styles.navTooltipPopup()}>
            {item.label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** A plain section heading followed by its rows — no collapse, no search. */
function StaticNavSection({
  section,
  activeHref,
  showTooltips,
}: {
  section: NavSection;
  activeHref: string | undefined;
  showTooltips: boolean;
}) {
  return (
    <div className={styles.navSection()}>
      <span className={styles.navSectionStaticLabel()}>
        <span className={styles.navSectionLabel()}>{section.label}</span>
      </span>
      {section.items.map((item) => (
        <NavRow
              key={item.href}
              item={item}
              activeHref={activeHref}
              showTooltip={showTooltips}
            />
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
  showTooltips,
}: {
  section: NavSection;
  activeHref: string | undefined;
  showTooltips: boolean;
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
            <NavRow
              key={item.href}
              item={item}
              activeHref={activeHref}
              showTooltip={showTooltips}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavSectionGroup({
  section,
  activeHref,
  showTooltips,
}: {
  section: NavSection;
  activeHref: string | undefined;
  showTooltips: boolean;
}) {
  if (section.collapsible) {
    return <CollapsibleNavSection
        section={section}
        activeHref={activeHref}
        showTooltips={showTooltips}
      />;
  }

  return (
    <StaticNavSection
      section={section}
      activeHref={activeHref}
      showTooltips={showTooltips}
    />
  );
}
