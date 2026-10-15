'use client';

/**
 * The checkout's dropdown, themed.
 *
 * ── WHY THIS IS NOT A <select> ────────────────────────────────────────────
 * It was. A native `<select>` can be styled in its CLOSED state — border,
 * padding, font, caret — and that is all the previous version did. The list
 * that drops open is drawn by the operating system, not the page: Chrome on
 * Windows paints it in a grey system highlight with the system font, and no
 * amount of CSS on the `<option>` elements changes it. (`appearance:
 * base-select` is landing in Chromium but is nowhere near safe to ship.)
 *
 * So the open list is the one part of this form that ignored the site's
 * design entirely, and the only way to theme it is to stop using the native
 * popup and draw one.
 *
 * ── WHAT THAT COSTS, AND WHAT IS DONE ABOUT IT ───────────────────────────
 * A div with an onClick is NOT a replacement for a <select>: it loses
 * keyboard operation, screen-reader semantics and focus handling, all of
 * which the native control gives for free. Those are reimplemented here
 * rather than dropped:
 *
 *   • combobox/listbox ARIA, with aria-expanded, aria-activedescendant and
 *     aria-selected, so the control announces as a dropdown and reads out the
 *     highlighted option as it moves
 *   • Arrow keys, Home/End, Enter, Space, Escape and Tab
 *   • type-ahead: typing "h" jumps to Homemaker, exactly as a native select
 *     does, with the buffer clearing after 600ms
 *   • focus returns to the button when the list closes, so Tab order is not
 *     lost mid-form
 *   • the list flips above the button when there is not enough room below,
 *     which matters on a phone where this field sits near the docked bar
 *
 * ⚠️ ONE REAL REGRESSION, ACCEPTED: on a phone this no longer opens the OS
 * picker (the iOS wheel). That picker is genuinely good, and this is a
 * deliberate trade for a consistent look on both platforms, which is what was
 * asked for. The list is given 44px rows and its own scroll so it stays
 * usable with a thumb.
 *
 * ⚠️ AND ONE SMALLER ONE: the country field loses
 * `autoComplete="tel-country-code"`, because that attribute only means
 * anything on a real form control. Browser autofill can no longer populate
 * the dial code. It still populates the number beside it, which is the field
 * people actually autofill.
 */

import { CaretDown, Check } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useId, useRef, useState } from 'react';

import { C } from '../_landing/shared';

export type SelectOption = {
  value: string;
  label: string;
  /**
   * A shorter form for the CLOSED button, when the full label does not fit.
   *
   * The dial-code picker needs it: "Saudi Arabia (+966)" in a 124px control
   * beside a phone-number field truncates to "Saudi Arabia (+…" and loses the
   * one part that matters. The button shows "+966" and the open list shows
   * the country, which is how phone inputs are normally built — and it hands
   * the width back to the number field, which is the one being typed into.
   */
  short?: string;
};

export function ThemedSelect({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  invalid = false,
  className = '',
  buttonClassName = '',
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown, in muted ink, when nothing is chosen yet. */
  placeholder?: string;
  ariaLabel?: string;
  invalid?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  /* The keyboard cursor, which is NOT the selection: moving through the list
     with arrows must not change the committed value until Enter. */
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ buffer: '', at: 0 });

  const baseId = useId();
  const listId = `${baseId}-list`;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  /* Open ON the current selection, not at the top: a returning buyer pressing
     Down should step from where they are, which is what a native select does. */
  const openList = () => {
    const btn = buttonRef.current;
    if (btn) {
      /* 280 is the list's max height. Flip up when the gap below cannot hold
         it AND there is more room above, so the list never opens off-screen
         behind the docked bar. */
      const r = btn.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      setDropUp(below < 280 && r.top > below);
    }
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commit = (i: number) => {
    const opt = options[i];
    if (opt) onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  /* Close on a click anywhere else. `pointerdown`, not `click`: a click fires
     after mouseup, so a mousedown on the page followed by a drag onto the
     list would otherwise leave the list open. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  /* Keep the highlighted row in view when arrowing through a scrolled list. */
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLLIElement>(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    /* Type-ahead first, so a letter is never swallowed by the cases below. */
    if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      typed.current.buffer = now - typed.current.at > 600 ? e.key : typed.current.buffer + e.key;
      typed.current.at = now;
      const q = typed.current.buffer.toLowerCase();
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(q));
      if (hit >= 0) {
        e.preventDefault();
        if (open) setActive(hit);
        else onChange(options[hit].value);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        if (!open) {
          openList();
          return;
        }
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActive((i) => Math.min(options.length - 1, Math.max(0, i + step)));
        return;
      }
      case 'Home':
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        return;
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        return;
      case 'Enter':
        /* Always swallowed: this control sits inside a form, and an Enter that
           reaches it would submit the checkout instead of choosing an option. */
        e.preventDefault();
        if (open) commit(active);
        else openList();
        return;
      case ' ':
        e.preventDefault();
        if (open) commit(active);
        else openList();
        return;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      case 'Tab':
        /* Let focus leave, but do not leave a popup hanging over the page. */
        if (open) setOpen(false);
        return;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${baseId}-opt-${active}` : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-[15px] outline-none transition-colors ${buttonClassName}`}
        style={{
          background: C.page,
          color: selected ? C.ink : C.inkSoft,
          border: `1px solid ${invalid ? C.error : open ? C.lineStrong : C.line}`,
          boxShadow: open ? `0 0 0 3px rgba(6,182,212,0.18)` : undefined,
        }}
      >
        <span className="truncate">
          {selected ? (selected.short ?? selected.label) : placeholder}
        </span>
        <CaretDown
          weight="bold"
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: C.inkSoft }}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          tabIndex={-1}
          /* ⚠️ NOT `inset-x-0`. Pinning the list to the button's width is
             fine for a full-width field, but the dial-code button is 96px,
             and the list inherited that and truncated every country to
             "Indi…" / "Canad…" — which is the exact problem moving the code
             onto the button was meant to solve.

             `min-w-full` keeps it at least as wide as its button (so the
             occupation list still fills the field) and `w-max` lets it grow
             to its longest row ("Saudi Arabia (+966)"). The max-width stops a
             long list running off a narrow phone; it opens rightward from
             `left-0`, which is safe because the only narrow use of this
             control sits on the left of its row. */
          className={`pp-select-pop absolute left-0 z-[60] w-max min-w-full max-w-[min(80vw,320px)] overflow-auto rounded-xl py-1.5 ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{
            maxHeight: 280,
            background: C.surface,
            border: `1px solid ${C.lineStrong}`,
            boxShadow: '0 18px 40px -16px rgba(6, 20, 28, 0.28)',
          }}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            const isActive = i === active;
            return (
              <li
                key={o.value}
                id={`${baseId}-opt-${i}`}
                data-i={i}
                role="option"
                aria-selected={isSel}
                /* pointerdown, not click: the document-level pointerdown
                   listener above would otherwise close the list before the
                   click landed. */
                onPointerDown={(e) => {
                  e.preventDefault();
                  commit(i);
                }}
                onMouseEnter={() => setActive(i)}
                className="flex cursor-pointer items-center justify-between gap-2 px-4 text-[15px]"
                style={{
                  /* 44px rows: this list is operated with a thumb on a phone,
                     where the native picker used to do the sizing for us. */
                  minHeight: 44,
                  background: isActive ? 'rgba(6,182,212,0.12)' : 'transparent',
                  color: isSel ? C.ink : C.inkSoft,
                  fontWeight: isSel ? 700 : 500,
                }}
              >
                <span className="truncate">{o.label}</span>
                {isSel && (
                  <Check weight="bold" aria-hidden className="h-4 w-4 shrink-0" style={{ color: C.accent }} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
