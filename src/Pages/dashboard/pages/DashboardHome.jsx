
import './DashboardHome.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarDays,
  // Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  CreditCard,
  Gift,
  MessageCircle,
  Package,
  ShoppingBag,
  Users,
  Zap,
} from 'lucide-react';

import { businessHoursApi } from '../../../services/dashboard/business-hours.api.js';
import { dashboardOverviewApi } from '../../../services/dashboard/dashboard-overview.api.js';
import { onboardingApi } from '../../../services/dashboard/onboarding.api.js';

import {
  StatCard,
  StatGrid,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';

import {
  getCurrentUser,
  getCurrentWorkspace,
} from '../../../services/dashboardApi';

/* ==========================================
   ONBOARDING STEPS
========================================== */

const setupSteps = [
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Add your account and business details.',
    time: '1 min',
    route: '/dashboard/profile',
  },
  {
    id: 'brain',
    title: 'Set up your AI Brain',
    description:
      'Tell the AI about your business: what you offer, your opening hours and common questions.',
    time: '~4 min',
    route: '/dashboard/brain?tab=setup',
  },
  {
    id: 'plan',
    title: 'Start your free plan',
    description: 'Free, no card needed.',
    time: '1 min',
    plan: true,
  },
  {
    id: 'test',
    title: 'Test your AI assistant',
    description: 'See how your AI answers customers.',
    time: '1 min',
    route: '/dashboard/brain?tab=test-ai',
  },
  {
    id: 'whatsapp',
    title: 'Connect your WhatsApp',
    description: 'Connect your business number.',
    time: '2 min',
    route: '/whatsapp',
  },
];

/* ==========================================
   RESPONSE HELPERS
========================================== */

function getData(response) {
  return response?.data?.data ??
    response?.data ??
    response ??
    {};
}

function getCompletedSteps(response) {
  const data = getData(response);

  const value =
    data?.completed_steps ??
    data?.steps ??
    data?.checklist ??
    data;

  if (Array.isArray(value)) {
    return value
      .filter((step) => {
        if (typeof step === 'string') return true;

        return (
          step?.is_complete === true ||
          step?.completed === true ||
          step?.done === true ||
          ['complete', 'completed', 'done'].includes(
            String(step?.status || '').toLowerCase()
          )
        );
      })
      .map((step) =>
        typeof step === 'string'
          ? step
          : step?.id ?? step?.key
      )
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, step]) => {
        if (step === true) return true;

        return (
          step?.is_complete === true ||
          step?.completed === true ||
          step?.done === true ||
          ['complete', 'completed', 'done'].includes(
            String(step?.status || '').toLowerCase()
          )
        );
      })
      .map(([key]) => key);
  }

  return [];
}

function getOverviewValue(overview, key) {
  return (
    overview?.stats?.[key] ??
    overview?.metrics?.[key] ??
    overview?.[key] ??
    '—'
  );
}

function getWeeklyDays(hours) {
  if (!hours) return [];

  const source =
    Array.isArray(hours)
      ? hours
      : hours?.days ??
        hours?.weekly_hours ??
        hours?.schedule ??
        [];

  if (Array.isArray(source)) {
    return source;
  }

  if (source && typeof source === 'object') {
    return Object.entries(source).map(([day, value]) => ({
      day,
      ...(value && typeof value === 'object'
        ? value
        : {}),
    }));
  }

  return [];
}

function getDayName(day) {
  return String(
    day?.day ?? day?.name ?? day?.weekday ?? ''
  );
}

function getDayTimes(day) {
  if (
    day?.closed === true ||
    day?.is_closed === true ||
    day?.is_open === false ||
    day?.enabled === false
  ) {
    return 'Closed';
  }

  if (day?.is_24_hours === true) {
    return '24 hours';
  }

  const opening =
    day?.open ??
    day?.open_time ??
    day?.opening_time ??
    day?.start ??
    '';

  const closing =
    day?.close ??
    day?.close_time ??
    day?.closing_time ??
    day?.end ??
    '';

  if (!opening || !closing) {
    return 'Closed';
  }

  return `${opening} to ${closing}`;
}

function getHoursSummary(hours, overview) {
  const summary =
    overview?.business_hours_summary ??
    hours?.summary ??
    hours?.hours_summary;

  if (
    typeof summary === 'string' &&
    summary.trim()
  ) {
    return summary;
  }

  const days = getWeeklyDays(hours);

  if (!days.length) {
    return '';
  }

  const shortDay = (value) => {
    const name = String(value).toLowerCase();

    const names = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };

    return names[name] || value;
  };

  const orderedDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const ordered = orderedDays
    .map((name) =>
      days.find(
        (day) =>
          getDayName(day).toLowerCase() === name
      )
    )
    .filter(Boolean);

  if (ordered.length === 7) {
    const firstSix = ordered.slice(0, 6);
    const firstTime = getDayTimes(firstSix[0]);

    const sameWeekHours = firstSix.every(
      (day) => getDayTimes(day) === firstTime
    );

    const sundayClosed =
      getDayTimes(ordered[6]) === 'Closed';

    if (sameWeekHours && sundayClosed) {
      return `Mon-Sat ${firstTime}, Sun closed`;
    }
  }

  return days
    .map(
      (day) =>
        `${shortDay(getDayName(day))} ${getDayTimes(day)}`
    )
    .join(', ');
}

function getFirstName(user) {
  const person =
    user?.user ??
    user?.profile ??
    user ??
    {};

  const name =
    person?.first_name ??
    person?.full_name ??
    person?.name ??
    '';

  return String(name).trim().split(/\s+/)[0] || '';
}

/* ==========================================
   MAIN DASHBOARD PAGE
========================================== */

export default function DashboardHome() {
  const navigate = useNavigate();

  const { openFreePlan, isStarted } = useFreePlan();

  const { showNotice, Notice } = useNotice();

  const [overview, setOverview] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [businessHours, setBusinessHours] = useState(null);

  const [user, setUser] = useState(null);
  const [, setWorkspace] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isConfirmingHours, setIsConfirmingHours] =
    useState(false);

  const [loadError, setLoadError] = useState('');

  /* ========================================
     LOAD DASHBOARD DATA
  ======================================== */

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    const results = await Promise.allSettled([
      dashboardOverviewApi.request(),
      onboardingApi.request(),
      businessHoursApi.request(),
      getCurrentUser(),
      getCurrentWorkspace(),
    ]);

    const [
      overviewResult,
      onboardingResult,
      hoursResult,
      userResult,
      workspaceResult,
    ] = results;

    if (overviewResult.status === 'fulfilled') {
      const data = getData(overviewResult.value);

      setOverview(data?.overview ?? data);
    } else {
      setLoadError(
        overviewResult.reason?.message ||
          'Unable to load dashboard overview.'
      );
    }

    if (onboardingResult.status === 'fulfilled') {
      setCompleted(
        getCompletedSteps(onboardingResult.value)
      );
    }

    if (hoursResult.status === 'fulfilled') {
      const data = getData(hoursResult.value);

      setBusinessHours(
        data?.business_hours ??
          data?.hours ??
          data
      );
    }

    if (userResult.status === 'fulfilled') {
      setUser(getData(userResult.value));
    }

    if (workspaceResult.status === 'fulfilled') {
      const data = getData(workspaceResult.value);

      setWorkspace(data?.workspace ?? data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ========================================
     CHECKLIST PROGRESS
  ======================================== */

  const isStepComplete = useCallback(
    (step) => {
      if (step.plan && isStarted) return true;

      return completed.includes(step.id);
    },
    [completed, isStarted]
  );

  const doneCount = setupSteps.filter(
    isStepComplete
  ).length;

  const nextStep = setupSteps.find(
    (step) => !isStepComplete(step)
  );

  const otherSteps = setupSteps.filter(
    (step) => step.id !== nextStep?.id
  );

  const progressLabel =
    `${doneCount} of ${setupSteps.length} complete`;

  /* ========================================
     BUSINESS HOURS
  ======================================== */

  // const weeklyDays = useMemo(
  //   () => getWeeklyDays(businessHours),
  //   [businessHours]
  // );

  const hoursSummary = getHoursSummary(
    businessHours,
    overview
  );

  const hoursConfirmed =
    businessHours?.is_confirmed === true ||
    businessHours?.confirmed === true;

  const showHoursConfirmation =
    Boolean(hoursSummary) && !hoursConfirmed;

  /* ========================================
     USER DETAILS
  ======================================== */

  const firstName = getFirstName(user);

  const welcomeText = firstName
    ? `Welcome to Bellbee, ${firstName}. Let's get your AI ready.`
    : "Welcome to Bellbee. Let's get your AI ready.";

  /* ========================================
     OPEN SETUP STEP
  ======================================== */

  const openStep = (step) => {
    if (!step) return;

    if (step.plan) {
      openFreePlan();
      return;
    }

    if (step.route) {
      navigate(step.route);
    }
  };

  /* ========================================
     MARK STEP COMPLETE
  ======================================== */

  const markStepComplete = async () => {
    if (!nextStep || nextStep.plan) return;

    if (!onboardingApi.isConfigured()) {
      showNotice(
        'Onboarding API is not configured yet.'
      );
      return;
    }

    setIsSavingStep(true);

    try {
      await onboardingApi.request({
        method: 'PATCH',
        id: nextStep.id,
        body: {
          is_complete: true,
        },
      });

      setCompleted((current) =>
        current.includes(nextStep.id)
          ? current
          : [...current, nextStep.id]
      );

      showNotice('Setup step marked complete.');

      await loadDashboard();
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setIsSavingStep(false);
    }
  };

  /* ========================================
     CONFIRM OPENING HOURS
  ======================================== */

  const confirmHours = async () => {
    if (!businessHoursApi.isConfigured()) {
      showNotice(
        'Business hours API is not configured yet.'
      );
      return;
    }

    setIsConfirmingHours(true);

    try {
      await businessHoursApi.request({
        method: 'POST',
        action: 'confirm-defaults',
        body: {},
      });

      setBusinessHours((current) =>
        current
          ? {
              ...current,
              is_default_example: false,
              is_example_hours: false,
              is_confirmed: true,
              confirmed: true,
            }
          : current
      );

      showNotice(
        'Your opening hours have been confirmed.'
      );
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setIsConfirmingHours(false);
    }
  };

  /* ========================================
     DASHBOARD STATS
  ======================================== */

  const stats = useMemo(
    () => [
      {
        label: 'Total chats',
        value: getOverviewValue(
          overview,
          'total_chats'
        ),
        icon: MessageCircle,
      },
      {
        label: 'Customers',
        value: getOverviewValue(
          overview,
          'customers'
        ),
        icon: Users,
        accent: 'lavender',
      },
      {
        label: 'Orders',
        value: getOverviewValue(
          overview,
          'orders'
        ),
        icon: ShoppingBag,
        accent: 'yellow',
      },
      {
        label: 'Appointments',
        value: getOverviewValue(
          overview,
          'appointments'
        ),
        icon: CalendarDays,
        accent: 'green',
      },
    ],
    [overview]
  );

  const displayStat = (value) => {
    if (isLoading) return '—';

    if (
      value === null ||
      value === undefined ||
      value === '—'
    ) {
      return '—';
    }

    return typeof value === 'number'
      ? value.toLocaleString()
      : value;
  };

  /* ========================================
     PAGE UI
  ======================================== */

  return (
    <div className="dp-dashboard-home">
      {/* DASHBOARD HEADING */}

      <header className="dp-home-page-heading">
        <h1>Dashboard</h1>
        <p>{welcomeText}</p>
      </header>

      {Notice}

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error"
          role="status"
        >
          {loadError}
        </div>
      )}

      {/* =====================================
          GET STARTED CARD
      ===================================== */}

      <section className="dp-onboarding-card">
        <div className="dp-onboarding-top">
          <h2>Get started</h2>

          <div className="dp-onboarding-top-actions">
            <span>
              {isLoading
                ? 'Loading...'
                : progressLabel}
            </span>

            <button
              type="button"
              className="dp-onboarding-collapse-button"
              onClick={() =>
                setIsCollapsed((current) => !current)
              }
              aria-label={
                isCollapsed
                  ? 'Expand setup checklist'
                  : 'Collapse setup checklist'
              }
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronDown size={17} />
              ) : (
                <ChevronUp size={17} />
              )}
            </button>
          </div>
        </div>

        {/* 5 SEGMENT PROGRESS BAR */}

        <div
          className="dp-progress-segments"
          aria-label={progressLabel}
        >
          {setupSteps.map((step) => (
            <span
              key={step.id}
              className={
                isStepComplete(step)
                  ? 'complete'
                  : ''
              }
            />
          ))}
        </div>

        {!isCollapsed && (
          <div className="dp-onboarding-content">
            {/* NEXT STEP */}

            {nextStep ? (
              <div className="dp-next-step-card">
                <div className="dp-next-step-main">
                  <span className="dp-next-step-icon">
                    <BookOpen size={21} />
                  </span>

                  <div className="dp-next-step-copy">
                    <span className="dp-next-step-kicker">
                      NEXT STEP
                    </span>

                    <h3>{nextStep.title}</h3>

                    <p>{nextStep.description}</p>
                  </div>
                </div>

                <div className="dp-next-step-actions">
                  <button
                    type="button"
                    className="dp-primary-button"
                    onClick={() => openStep(nextStep)}
                  >
                    {nextStep.plan
                      ? 'Start free plan'
                      : 'Continue'}
                  </button>

                  <span className="dp-next-step-time">
                    {nextStep.time}
                  </span>

                  {!nextStep.plan && (
                    <button
                      type="button"
                      className="dp-next-step-skip"
                      onClick={markStepComplete}
                      disabled={isSavingStep}
                    >
                      {isSavingStep
                        ? 'Saving...'
                        : "Don't need this? Mark as complete"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="dp-setup-finished">
                <CheckCircle2 size={22} />

                <div>
                  <strong>You're all set!</strong>

                  <p>
                    All five setup steps are complete.
                  </p>
                </div>
              </div>
            )}

            {/* OPENING HOURS CONFIRMATION */}

            {showHoursConfirmation && (
              <div className="dp-opening-hours-confirmation">
                <span className="dp-hours-small-label">
                  Your opening hours
                </span>

                <p className="dp-hours-summary">
                  {hoursSummary}
                </p>

                <div className="dp-opening-hours-actions">
                  <button
                    type="button"
                    className="dp-home-neutral-button"
                    onClick={confirmHours}
                    disabled={isConfirmingHours}
                  >
                    {isConfirmingHours
                      ? 'Saving...'
                      : 'Yes, these are my hours'}
                  </button>

                  <button
                    type="button"
                    className="dp-home-link-button"
                    onClick={() =>
                      navigate(
                        '/dashboard/brain?tab=hours-staff'
                      )
                    }
                  >
                    Change hours
                  </button>
                </div>
              </div>
            )}

            {/* CHECKLIST ITEMS */}

            <div className="dp-setup-list">
              {otherSteps.map((step) => {
                const complete = isStepComplete(step);

                return (
                  <button
                    type="button"
                    key={step.id}
                    className={`dp-setup-step ${
                      complete ? 'completed' : ''
                    }`}
                    onClick={() =>
                      !complete && openStep(step)
                    }
                    disabled={complete}
                  >
                    <span className="dp-step-status">
                      {complete ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Circle size={17} />
                      )}
                    </span>

                    <span className="dp-step-content">
                      <strong>{step.title}</strong>
                    </span>

                    <span className="dp-step-time">
                      {complete
                        ? 'Done'
                        : step.time}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SETUP FOOTER */}

            <div className="dp-onboarding-footer">
              <span>
                <Zap size={13} />
                Setup takes approximately 9 minutes
              </span>

              <button
                type="button"
                className="dp-home-help-link"
                onClick={() =>
                  navigate('/dashboard/support')
                }
              >
                Prefer a hand? Get setup help
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================
          EARLY BIRD OFFER
      ===================================== */}

      <section className="dp-early-bird-banner">
        <span className="dp-early-bird-icon">
          <Gift size={22} />
        </span>

        <div className="dp-early-bird-copy">
          <h2>Unlock your early-bird price</h2>

          <p>
            49% off Bellbee AI, locked for 2 years.
            It unlocks the moment Bellbee AI replies
            to your first real customer.
          </p>
        </div>
      </section>

      {/* =====================================
          BUSINESS ACTIVITY
          Existing functionality preserved
      ===================================== */}

      <section className="dp-home-activity-section">
        <div className="dp-home-section-heading">
          <div>
            <h2>Your business activity</h2>

            <p>
              A quick overview of your business.
            </p>
          </div>
        </div>

        <StatGrid columns={4}>
          {stats.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={displayStat(item.value)}
              icon={item.icon}
              accent={item.accent}
            />
          ))}
        </StatGrid>
      </section>

      {/* =====================================
          QUICK LINKS
      ===================================== */}

      <section className="dp-home-quick-links">
        <button
          type="button"
          onClick={() =>
            navigate('/dashboard/products')
          }
        >
          <Package size={16} />
          Add a product
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={() =>
            navigate('/dashboard/brain?tab=setup')
          }
        >
          <Bot size={16} />
          Configure AI
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={() =>
            navigate('/dashboard/billing')
          }
        >
          <CreditCard size={16} />
          View plan
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={() =>
            navigate('/dashboard/appointments')
          }
        >
          <Clock3 size={16} />
          Manage bookings
          <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
}