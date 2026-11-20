
import { suggestionsApi } from '../../../services/dashboard/suggestions.api.js';
import './SuggestionsPage.css';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';

import {
  ChevronUp,
  ChevronDown,
  Check,
  Lightbulb,
  Plus,
  X,
} from 'lucide-react';

import {
  PageHeader,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

const suggestionTabs = [
  { label: 'All Suggestions', value: 'all' },
  { label: 'My Suggestions', value: 'mine' },
];

const categories = [
  'Feature Request',
  'Bug Report',
  'Remove / Change',
  'Improvement',
  'Other',
];

const initialForm = {
  category: 'Feature Request',
  title: '',
  description: '',
};

function unwrap(response) {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function suggestionRecords(response) {
  const data = unwrap(response);

  if (Array.isArray(data)) {
    return data;
  }

  const records =
    data?.suggestions ||
    data?.items ||
    data?.results ||
    data?.data ||
    [];

  return Array.isArray(records) ? records : [];
}

function suggestionId(suggestion) {
  return String(
    suggestion?.id ??
    suggestion?.suggestion_id ??
    ''
  );
}

function hasVoted(suggestion) {
  return Boolean(
    suggestion?.has_voted ??
    suggestion?.voted_by_me ??
    suggestion?.upvoted ??
    false
  );
}

function getVoteCount(suggestion) {
  const raw =
    suggestion?.vote_count ??
    suggestion?.votes_count ??
    suggestion?.upvotes ??
    suggestion?.votes;

  if (Array.isArray(raw)) {
    return raw.length;
  }

  if (raw === undefined || raw === null) {
    return null;
  }

  const number = Number(raw);

  return Number.isFinite(number) ? number : null;
}

function formatCategory(type) {
  if (!type) return 'Other';

  if (type === 'Bug') return 'Bug Report';

  return String(type)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');
}

export default function SuggestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab =
    searchParams.get('tab') === 'mine' ? 'mine' : 'all';

  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [votingId, setVotingId] = useState('');

  const { showNotice, Notice } = useNotice();

  const refreshSuggestions = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  /* Load suggestions from the existing API */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError('');

      if (
        typeof suggestionsApi.isConfigured === 'function' &&
        !suggestionsApi.isConfigured()
      ) {
        setSuggestions([]);
        setLoadError(
          'Suggestions API is not configured yet.'
        );
        setIsLoading(false);
        return;
      }

      try {
        const response = await suggestionsApi.request({
          query: {
            mine: activeTab === 'mine',
          },
        });

        if (cancelled) return;

        setSuggestions(suggestionRecords(response));
      } catch (error) {
        if (cancelled) return;

        setSuggestions([]);
        setLoadError(
          error.message || 'Unable to load suggestions.'
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, refreshKey]);

  /* Close modal with Escape and lock body scrolling */
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const onEscape = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        if (categoryOpen) {
          setCategoryOpen(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isSubmitting, categoryOpen]);

  function changeTab(value) {
    const params = new URLSearchParams(searchParams);

    if (value === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }

    setSearchParams(params, { replace: true });
  }

  function openModal() {
    setForm(initialForm);
    setCategoryOpen(false);
    setIsOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsOpen(false);
    setCategoryOpen(false);
  }

  function updateForm(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* Submit new idea through the existing backend */
  async function submitSuggestion(event) {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await suggestionsApi.request({
        method: 'POST',
        body: {
          type: form.category,
          title,
          description,
        },
      });

      setForm(initialForm);
      setIsOpen(false);
      setCategoryOpen(false);

      showNotice('Your suggestion has been submitted.');

      refreshSuggestions();
    } catch (error) {
      showNotice(
        error.message || 'Could not submit your suggestion.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* Upvote / remove upvote */
  async function toggleVote(suggestion) {
    const id = suggestionId(suggestion);

    if (!id || votingId) return;

    const previouslyVoted = hasVoted(suggestion);
    const nextVote = !previouslyVoted;

    setVotingId(id);

    try {
      const response = await suggestionsApi.request({
        method: 'PATCH',
        id,
        body: {
          has_voted: nextVote,
        },
      });

      const payload = unwrap(response);

      const updated =
        payload?.suggestion ||
        payload?.item ||
        payload ||
        {};

      setSuggestions((current) =>
        current.map((item) => {
          if (suggestionId(item) !== id) {
            return item;
          }

          const existingCount = getVoteCount(item);

          const returnedCount = getVoteCount(updated);

          const nextCount =
            returnedCount !== null
              ? returnedCount
              : existingCount !== null
                ? Math.max(
                    0,
                    existingCount + (nextVote ? 1 : -1)
                  )
                : null;

          return {
            ...item,
            ...updated,
            has_voted:
              updated.has_voted ??
              updated.voted_by_me ??
              nextVote,
            ...(nextCount !== null
              ? { vote_count: nextCount }
              : {}),
          };
        })
      );
    } catch (error) {
      showNotice(
        error.message || 'Could not update your vote.'
      );
    } finally {
      setVotingId('');
    }
  }

  const categoryOptions = categories.map((item) => (
    <button
      type="button"
      role="option"
      aria-selected={form.category === item}
      className={`dp-suggestion-category-option ${
        form.category === item ? 'selected' : ''
      }`}
      key={item}
      onClick={() => {
        updateForm('category', item);
        setCategoryOpen(false);
      }}
    >
      <span>{item}</span>

      {form.category === item && <Check size={15} />}
    </button>
  ));

  return (
    <main className="dp-suggestions-page">
      <PageHeader
        title="Suggestion Box"
        description="Tell us what to add, change, or remove, and upvote what other businesses have suggested"
        actions={
          <button
            type="button"
            className="dp-primary-button dp-suggestions-new-button"
            onClick={openModal}
          >
            <Plus size={15} />
            Submit idea
          </button>
        }
      />

      {Notice}

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error"
          role="status"
        >
          {loadError}
        </div>
      )}

      {/* Tabs */}
      <div
        className="dp-suggestions-tabs"
        role="tablist"
        aria-label="Suggestion categories"
      >
        {suggestionTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`dp-suggestions-tab ${
              activeTab === tab.value ? 'active' : ''
            }`}
            onClick={() => changeTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <section className="dp-suggestions-content">
        {isLoading ? (
          <div className="dp-suggestions-loading">
            Loading suggestions…
          </div>
        ) : loadError ? (
          <div className="dp-suggestions-empty">
            <Lightbulb size={27} />
            <p>Suggestions are currently unavailable.</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="dp-suggestion-list">
            {suggestions.map((suggestion, index) => {
              const id = suggestionId(suggestion);
              const voted = hasVoted(suggestion);
              const voteCount = getVoteCount(suggestion);

              return (
                <article
                  className="dp-suggestion-card"
                  key={id || index}
                >
                  <button
                    type="button"
                    className={`dp-suggestion-vote ${
                      voted ? 'voted' : ''
                    }`}
                    onClick={() => toggleVote(suggestion)}
                    disabled={!id || votingId === id}
                    aria-pressed={voted}
                    aria-label={`${
                      voted ? 'Remove upvote' : 'Upvote'
                    }: ${suggestion.title || 'Suggestion'}`}
                  >
                    <ChevronUp size={17} />

                    <strong>
                      {voteCount === null ? '—' : voteCount}
                    </strong>
                  </button>

                  <div className="dp-suggestion-card-content">
                    <span className="dp-suggestion-type">
                      {formatCategory(
                        suggestion.type ||
                        suggestion.category
                      )}
                    </span>

                    <h3>
                      {suggestion.title || 'Untitled suggestion'}
                    </h3>

                    <p>
                      {suggestion.description || ''}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : activeTab === 'mine' ? (
          <div className="dp-suggestions-empty">
            <Lightbulb size={29} />

            <p>
              You haven't submitted a suggestion yet.
            </p>
          </div>
        ) : (
          <div className="dp-suggestions-empty">
            <Lightbulb size={29} />

            <p>No suggestions yet.</p>

            <button
              type="button"
              className="dp-primary-button"
              onClick={openModal}
            >
              <Plus size={14} />
              Submit idea
            </button>
          </div>
        )}
      </section>

      {/* Submit Suggestion Modal */}
      {isOpen &&
        createPortal(
          <div
            className="dp-suggestions-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              className="dp-suggestions-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dp-suggestion-modal-title"
            >
              <div className="dp-suggestions-modal-header">
                <h2 id="dp-suggestion-modal-title">
                  Submit a suggestion
                </h2>

                <button
                  type="button"
                  className="dp-suggestions-modal-close"
                  onClick={closeModal}
                  aria-label="Close modal"
                  disabled={isSubmitting}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="dp-suggestions-modal-body">
                <form
                  id="dp-suggestion-submit-form"
                  onSubmit={submitSuggestion}
                >
                  <div className="dp-suggestion-form-top">
                    {/* Custom Category Dropdown */}
                    <div className="dp-suggestion-field">
                      <label htmlFor="suggestion-category">
                        Category
                      </label>

                      <div className="dp-suggestion-select-wrap">
                        <button
                          id="suggestion-category"
                          type="button"
                          className={`dp-suggestion-select-trigger ${
                            categoryOpen ? 'open' : ''
                          }`}
                          aria-expanded={categoryOpen}
                          aria-haspopup="listbox"
                          onClick={() =>
                            setCategoryOpen((value) => !value)
                          }
                        >
                          <span>{form.category}</span>

                          <ChevronDown size={15} />
                        </button>

                        {categoryOpen && (
                          <div
                            className="dp-suggestion-category-menu"
                            role="listbox"
                            aria-label="Suggestion category"
                          >
                            {categoryOptions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="dp-suggestion-field">
                      <label htmlFor="suggestion-title">
                        Title
                      </label>

                      <input
                        id="suggestion-title"
                        type="text"
                        value={form.title}
                        onChange={(event) =>
                          updateForm(
                            'title',
                            event.target.value
                          )
                        }
                        placeholder="Short summary of your suggestion"
                        required
                        maxLength={120}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="dp-suggestion-field dp-suggestion-description-field">
                    <label htmlFor="suggestion-description">
                      Description
                    </label>

                    <textarea
                      id="suggestion-description"
                      value={form.description}
                      onChange={(event) =>
                        updateForm(
                          'description',
                          event.target.value
                        )
                      }
                      placeholder="Describe what you want added, changed, or removed, and why it would help your business."
                      rows={4}
                      maxLength={2000}
                      required
                    />
                  </div>
                </form>
              </div>

              <div className="dp-suggestions-modal-footer">
                <button
                  type="submit"
                  form="dp-suggestion-submit-form"
                  className="dp-primary-button dp-suggestions-submit-button"
                  disabled={
                    isSubmitting ||
                    !form.title.trim() ||
                    !form.description.trim()
                  }
                >
                  {isSubmitting
                    ? 'Submitting…'
                    : 'Submit Suggestion'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
