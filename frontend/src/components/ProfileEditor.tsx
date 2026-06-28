'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProfile, listProfileSources, updateProfile } from '@/lib/api';
import { BusinessProfile, ProfileSource } from '@/lib/types';

// ---------------------------------------------------------------------------
// Section + suggested-field config
// ---------------------------------------------------------------------------

type Suggestion = { key: string; kind: 'text' | 'list' };

const SECTION_CONFIG: {
  key: SectionKey;
  label: string;
  description: string;
  suggestions: Suggestion[];
}[] = [
  {
    key: 'company',
    label: 'Company',
    description: 'Who you are — identity, mission, stage, and team.',
    suggestions: [
      { key: 'name', kind: 'text' },
      { key: 'location', kind: 'text' },
      { key: 'stage', kind: 'text' },
      { key: 'team_size', kind: 'text' },
      { key: 'mission', kind: 'text' },
      { key: 'business_model', kind: 'text' },
    ],
  },
  {
    key: 'offer',
    label: 'Offer',
    description: 'What you sell — products, pricing, and proof points.',
    suggestions: [
      { key: 'core_products_or_services', kind: 'list' },
      { key: 'primary_problem_solved', kind: 'text' },
      { key: 'pricing_model', kind: 'text' },
      { key: 'differentiators', kind: 'list' },
    ],
  },
  {
    key: 'audience',
    label: 'Audience',
    description: 'Who you serve — ideal customers, pains, and desires.',
    suggestions: [
      { key: 'primary_icp', kind: 'list' },
      { key: 'pain_points', kind: 'list' },
      { key: 'desires', kind: 'list' },
      { key: 'objections', kind: 'list' },
    ],
  },
  {
    key: 'channels',
    label: 'Channels',
    description: 'How you reach people — owned, paid, organic, outbound.',
    suggestions: [
      { key: 'owned_channels', kind: 'list' },
      { key: 'paid_channels', kind: 'list' },
      { key: 'organic_channels', kind: 'list' },
      { key: 'sales_motion', kind: 'text' },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    description: 'Platforms, content pillars, and your voice online.',
    suggestions: [
      { key: 'platforms_active', kind: 'list' },
      { key: 'content_pillars', kind: 'list' },
      { key: 'brand_voice_on_social', kind: 'text' },
    ],
  },
  {
    key: 'metrics',
    label: 'Metrics',
    description: 'Revenue, lead flow, and the KPIs you watch.',
    suggestions: [
      { key: 'revenue_status', kind: 'text' },
      { key: 'lead_flow_status', kind: 'text' },
      { key: 'important_kpis', kind: 'list' },
    ],
  },
  {
    key: 'tech_stack',
    label: 'Tech Stack',
    description: 'Tools that run the business — frontend to automation.',
    suggestions: [
      { key: 'frontend', kind: 'list' },
      { key: 'backend', kind: 'list' },
      { key: 'marketing_tools', kind: 'list' },
      { key: 'analytics', kind: 'list' },
    ],
  },
  {
    key: 'constraints',
    label: 'Constraints',
    description: 'Real limits — budget, team, operations, legal.',
    suggestions: [
      { key: 'budget_constraints', kind: 'list' },
      { key: 'operational_constraints', kind: 'list' },
      { key: 'legal_constraints', kind: 'list' },
    ],
  },
  {
    key: 'strategy',
    label: 'Strategy',
    description: 'Goals, bets, risks, and open questions.',
    suggestions: [
      { key: 'current_goals', kind: 'list' },
      { key: 'key_bets', kind: 'list' },
      { key: 'key_risks', kind: 'list' },
      { key: 'open_questions', kind: 'list' },
    ],
  },
  {
    key: 'brand',
    label: 'Brand',
    description: 'Positioning, personality, tone, and competitors.',
    suggestions: [
      { key: 'positioning', kind: 'text' },
      { key: 'brand_personality', kind: 'list' },
      { key: 'tone_of_voice', kind: 'list' },
      { key: 'competitors', kind: 'list' },
    ],
  },
];

const SECTION_KEYS = [
  'company',
  'offer',
  'audience',
  'channels',
  'social',
  'metrics',
  'tech_stack',
  'constraints',
  'strategy',
  'brand',
] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

const CONFIDENCE_OPTIONS = ['', 'low', 'medium', 'high'] as const;

// ---------------------------------------------------------------------------
// JSON value helpers
// ---------------------------------------------------------------------------

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function isScalar(value: JsonValue): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isEmptyValue(value: JsonValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

/** Recursively trim strings and drop empty values (mirrors backend `_is_empty`). */
function clean(value: JsonValue): JsonValue {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value.map(clean).filter((item) => !isEmptyValue(item));
  }
  if (isPlainObject(value)) {
    const out: { [key: string]: JsonValue } = {};
    for (const [key, child] of Object.entries(value)) {
      const cleaned = clean(child);
      if (!isEmptyValue(cleaned)) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

function prettifyKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toFieldKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_');
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-amber-200';

// ---------------------------------------------------------------------------
// Value editors
// ---------------------------------------------------------------------------

function ConfidenceSelect({
  value,
  onChange,
}: {
  value: JsonValue;
  onChange: (next: JsonValue) => void;
}) {
  const current = typeof value === 'string' ? value : '';
  return (
    <select
      value={current}
      onChange={(event) => onChange(event.target.value)}
      className={INPUT_CLASS + ' cursor-pointer'}
    >
      {CONFIDENCE_OPTIONS.map((option) => (
        <option key={option || 'none'} value={option}>
          {option ? prettifyKey(option) : 'Not set'}
        </option>
      ))}
    </select>
  );
}

function ScalarEditor({
  value,
  onChange,
}: {
  value: JsonValue;
  onChange: (next: JsonValue) => void;
}) {
  const text = value === null || value === undefined ? '' : String(value);
  const multiline = text.length > 64 || text.includes('\n');

  if (multiline) {
    return (
      <textarea
        value={text}
        spellCheck={false}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS + ' resize-y leading-6'}
      />
    );
  }

  return (
    <input
      type="text"
      value={text}
      onChange={(event) => onChange(event.target.value)}
      className={INPUT_CLASS}
    />
  );
}

function ListEditor({
  value,
  onChange,
}: {
  value: JsonValue[];
  onChange: (next: JsonValue[]) => void;
}) {
  const setItem = (index: number, next: string) => {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  };
  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
  const addItem = () => onChange([...value, '']);

  return (
    <div className="space-y-2">
      {value.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No items yet.</p>
      ) : (
        value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="select-none text-[var(--text-muted)]">•</span>
            <input
              type="text"
              value={isScalar(item) ? String(item) : JSON.stringify(item)}
              onChange={(event) => setItem(index, event.target.value)}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label="Remove item"
              className="shrink-0 rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-red-600 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={addItem}
        className="text-xs font-medium text-[var(--gold)] hover:text-amber-600 cursor-pointer"
      >
        + Add item
      </button>
    </div>
  );
}

function JsonFallbackEditor({
  value,
  onChange,
}: {
  value: JsonValue;
  onChange: (next: JsonValue) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: string) => {
    setText(next);
    try {
      onChange(JSON.parse(next) as JsonValue);
      setError(null);
    } catch {
      setError('Invalid JSON — last valid value kept.');
    }
  };

  return (
    <div>
      <textarea
        value={text}
        spellCheck={false}
        rows={5}
        onChange={(event) => handleChange(event.target.value)}
        className={INPUT_CLASS + ' font-mono text-xs leading-5'}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function ValueEditor({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: JsonValue;
  onChange: (next: JsonValue) => void;
}) {
  if (fieldKey === 'confidence') {
    return <ConfidenceSelect value={value} onChange={onChange} />;
  }
  if (Array.isArray(value)) {
    if (value.every(isScalar)) {
      return <ListEditor value={value} onChange={(next) => onChange(next)} />;
    }
    return <JsonFallbackEditor value={value} onChange={onChange} />;
  }
  if (isPlainObject(value)) {
    return <ObjectEditor value={value} onChange={onChange} nested />;
  }
  return <ScalarEditor value={value} onChange={onChange} />;
}

// ---------------------------------------------------------------------------
// Object (section / nested) editor
// ---------------------------------------------------------------------------

function ObjectEditor({
  value,
  onChange,
  suggestions = [],
  nested = false,
}: {
  value: { [key: string]: JsonValue };
  onChange: (next: { [key: string]: JsonValue }) => void;
  suggestions?: Suggestion[];
  nested?: boolean;
}) {
  const [customKey, setCustomKey] = useState('');

  const entries = Object.entries(value);
  const present = new Set(Object.keys(value));

  const setField = (key: string, next: JsonValue) =>
    onChange({ ...value, [key]: next });

  const removeField = (key: string) => {
    const copy = { ...value };
    delete copy[key];
    onChange(copy);
  };

  const addField = (key: string, initial: JsonValue) => {
    if (!key || present.has(key)) return;
    onChange({ ...value, [key]: initial });
  };

  const addCustom = () => {
    const key = toFieldKey(customKey);
    if (!key) return;
    addField(key, '');
    setCustomKey('');
  };

  const remainingSuggestions = suggestions.filter((s) => !present.has(s.key));
  const showConfidenceChip = !present.has('confidence');

  return (
    <div className={nested ? 'space-y-4 border-l border-[var(--border)] pl-4' : 'space-y-5'}>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Nothing here yet. Add a field below.
        </p>
      ) : (
        entries.map(([key, child]) => (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-[var(--text)]">
                {prettifyKey(key)}
              </label>
              <button
                type="button"
                onClick={() => removeField(key)}
                aria-label={`Remove ${prettifyKey(key)}`}
                className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-red-600 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ValueEditor
              fieldKey={key}
              value={child}
              onChange={(next) => setField(key, next)}
            />
          </div>
        ))
      )}

      {(remainingSuggestions.length > 0 || showConfidenceChip) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[var(--text-muted)]">Add:</span>
          {remainingSuggestions.map((suggestion) => (
            <button
              key={suggestion.key}
              type="button"
              onClick={() => addField(suggestion.key, suggestion.kind === 'list' ? [] : '')}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--text)] cursor-pointer"
            >
              + {prettifyKey(suggestion.key)}
            </button>
          ))}
          {showConfidenceChip && (
            <button
              type="button"
              onClick={() => addField('confidence', '')}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--text)] cursor-pointer"
            >
              + Confidence
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customKey}
          placeholder="Custom field name…"
          onChange={(event) => setCustomKey(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
          }}
          className={INPUT_CLASS + ' max-w-xs'}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customKey.trim()}
          className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          Add field
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes editor (string[])
// ---------------------------------------------------------------------------

function NotesEditor({
  notes,
  onChange,
}: {
  notes: string[];
  onChange: (next: string[]) => void;
}) {
  const setNote = (index: number, next: string) => {
    const copy = [...notes];
    copy[index] = next;
    onChange(copy);
  };
  const removeNote = (index: number) => onChange(notes.filter((_, i) => i !== index));
  const addNote = () => onChange([...notes, '']);

  return (
    <div className="space-y-2">
      {notes.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No notes yet.</p>
      ) : (
        notes.map((note, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2.5 select-none text-[var(--text-muted)]">•</span>
            <textarea
              value={note}
              rows={2}
              spellCheck={false}
              onChange={(event) => setNote(index, event.target.value)}
              className={INPUT_CLASS + ' resize-y leading-6'}
            />
            <button
              type="button"
              onClick={() => removeNote(index)}
              aria-label="Remove note"
              className="mt-1.5 shrink-0 rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-red-600 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={addNote}
        className="text-xs font-medium text-[var(--gold)] hover:text-amber-600 cursor-pointer"
      >
        + Add note
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

function countFilledSections(profile: BusinessProfile): number {
  return SECTION_KEYS.filter((key) => {
    const section = profile[key] as { [key: string]: JsonValue };
    return Object.values(section).some((value) => !isEmptyValue(value as JsonValue));
  }).length;
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [sources, setSources] = useState<ProfileSource[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [profileResponse, sourceList] = await Promise.all([
          getProfile(),
          listProfileSources(),
        ]);
        if (!isMounted) return;
        setProfile(profileResponse.profile);
        setUpdatedAt(profileResponse.updated_at);
        setSources(sourceList);
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage(
          error instanceof Error ? error.message : 'Failed to load business dossier.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filledCount = useMemo(
    () => (profile ? countFilledSections(profile) : 0),
    [profile],
  );

  const setSection = (key: SectionKey, next: { [key: string]: JsonValue }) => {
    setProfile((current) => (current ? { ...current, [key]: next } : current));
    setStatusMessage(null);
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setStatusMessage(null);

    const cleaned: BusinessProfile = {
      ...(clean(profile as unknown as JsonValue) as unknown as BusinessProfile),
      notes: profile.notes.map((note) => note.trim()).filter(Boolean),
    };
    // Ensure every section key exists even if cleaned away.
    for (const key of SECTION_KEYS) {
      if (!cleaned[key]) cleaned[key] = {};
    }

    try {
      const response = await updateProfile(cleaned);
      setProfile(response.profile);
      setUpdatedAt(response.updated_at);
      setStatusMessage('Business dossier saved. New council sessions will use it.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save business dossier.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          Loading business dossier...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Sticky header */}
        <section className="sticky top-0 z-10 -mx-6 border-b border-[var(--border)] bg-[var(--bg)]/85 px-6 pb-4 pt-1 backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                Persistent Context
              </p>
              <h2
                className="mt-1.5 text-3xl font-normal text-[var(--text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Business Dossier
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Fill in what the council should know about your business. It is injected
                into every new session — finished debates keep their own snapshot.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-[var(--gold)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Dossier'}
              </button>
              <div className="flex flex-wrap justify-end gap-2 text-xs text-[var(--text-secondary)]">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1">
                  {filledCount}/{SECTION_KEYS.length} sections filled
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1">
                  Saved: {formatTimestamp(updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {statusMessage ? (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text-secondary)]">
              {statusMessage}
            </div>
          ) : null}
        </section>

        {/* Section cards */}
        {SECTION_CONFIG.map((section) => (
          <section
            key={section.key}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]"
          >
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-[var(--text)]">{section.label}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {section.description}
              </p>
            </div>
            <ObjectEditor
              value={profile[section.key] as { [key: string]: JsonValue }}
              onChange={(next) => setSection(section.key, next)}
              suggestions={section.suggestions}
            />
          </section>
        ))}

        {/* Notes */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[var(--text)]">Notes</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Freeform caveats, conflicts, or facts that do not fit elsewhere.
            </p>
          </div>
          <NotesEditor
            notes={profile.notes}
            onChange={(next) =>
              setProfile((current) => (current ? { ...current, notes: next } : current))
            }
          />
        </section>

        {/* Profile sources (read-only) */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--text)]">Imported Sources</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Documents imported via script. Kept separate so you can trace context.
            </p>
          </div>
          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-5 text-sm text-[var(--text-muted)]">
                No sources imported yet.
              </div>
            ) : (
              sources.map((source) => (
                <article
                  key={source.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{source.source_name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        {source.source_type}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTimestamp(source.updated_at)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
