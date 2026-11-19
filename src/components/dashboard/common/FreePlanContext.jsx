import { freePlanActivateApi } from '../../../services/dashboard/free-plan-activate.api.js';
import { freePlanStatusApi } from '../../../services/dashboard/free-plan-status.api.js';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DashboardApiError } from '../../../services/dashboardApi';
import FreePlanModal from './FreePlanModal';

const FreePlanContext = createContext(null);

function hasStartedPlan(value) {
  const directValue = value?.is_started ?? value?.started ?? value?.active ?? value?.is_active ??
    value?.free_plan_started ?? value?.plan?.is_active ?? value?.subscription?.active;
  if (typeof directValue === 'boolean') return directValue;

  const status = String(
    value?.status || value?.plan?.status || value?.subscription?.status || value?.plan_status || '',
  ).toLowerCase();
  return ['active', 'started', 'trial', 'trialing', 'free', 'free_active'].includes(status);
}

export function FreePlanProvider({ children }) {
  const [isStarted, setIsStarted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isStatusKnown, setIsStatusKnown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const activatedCallback = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadPlanStatus = async () => {
      if (!freePlanStatusApi.isConfigured()) {
        if (isMounted) setIsChecking(false);
        return;
      }
      try {
        const result = await freePlanStatusApi.request();
        if (isMounted) {
          setIsStarted(hasStartedPlan(result));
          setIsStatusKnown(true);
        }
      } catch (requestError) {
        if (isMounted) setError(requestError.message);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };
    loadPlanStatus();
    return () => { isMounted = false; };
  }, []);

  const openFreePlan = useCallback((onActivated) => {
    activatedCallback.current = typeof onActivated === 'function' ? onActivated : null;
    setError('');
    setIsOpen(true);
  }, []);

  const closeFreePlan = useCallback(() => {
    setIsOpen(false);
    setError('');
    activatedCallback.current = null;
  }, []);

  const startFreePlan = useCallback(async () => {
    setIsStarting(true);
    setError('');
    try {
      if (!freePlanActivateApi.isConfigured()) {
        throw new DashboardApiError('Free-plan activation is not connected yet. Add the billing activation endpoint to enable this action.', 'ENDPOINT_NOT_CONFIGURED');
      }
      await freePlanActivateApi.request({ method: 'POST', body: {} });
      setIsStarted(true);
      setIsOpen(false);
      const callback = activatedCallback.current;
      activatedCallback.current = null;
      if (callback) await callback();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const value = { isStarted, isChecking, isStatusKnown, isOpen, isStarting, error, openFreePlan, closeFreePlan, startFreePlan };

  return (
    <FreePlanContext.Provider value={value}>
      {children}
      <FreePlanModal />
    </FreePlanContext.Provider>
  );
}

export function useFreePlan() {
  const context = useContext(FreePlanContext);
  if (!context) throw new Error('useFreePlan must be used inside FreePlanProvider.');
  return context;
}
