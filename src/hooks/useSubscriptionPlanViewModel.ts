import { useSubscriptionPlanStore } from '../stores/subscriptionPlan.store';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import type { ISubscriptionPlan } from '../types/subscription.interface';

export const useSubscriptionPlanViewModel = () => {
  const { subscriptionPlans, loading, error, lastFetched, fetchSubscriptionPlans, addSubscriptionPlan, editSubscriptionPlan, removeSubscriptionPlan } = useSubscriptionPlanStore();
  const { showNotification } = useNotification();

  const handleAdd = async (name: string, price_cents: number, duration_days: number, features: string[]) => {
    if (
      !name?.trim() ||
      price_cents == null || price_cents < 0 ||
      duration_days == null || duration_days < 0 ||
      !features?.length
    ) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }
    try {
      await addSubscriptionPlan(name, price_cents, duration_days, features);
      showNotification(t("notifications.subscriptionPlanAdded"), 'success');
    } catch {
      showNotification(t("notifications.errorAdding"), 'error');
    }
  };

  const handleEdit = async (plan: ISubscriptionPlan) => {
    if (
      !plan.id?.trim() ||
      !plan.created_at ||
      !plan.name?.trim() ||
      plan.price_cents == null || plan.price_cents < 0 ||
      plan.duration_days == null || plan.duration_days < 0 ||
      !plan.features?.length
    ) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }
    try {
      await editSubscriptionPlan(plan);
      showNotification(t("notifications.subscriptionPlanEdited"), 'success');
    } catch {
      showNotification(t("notifications.errorEditing"), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeSubscriptionPlan(id);
      showNotification(t("notifications.subscriptionPlanDeleted"), 'success');
    } catch {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchSubscriptionPlans,
    maxAge: MAX_CACHE_DURATION,
  });

  return {
    subscriptionPlans,
    loading,
    error,
    handleAdd,
    handleEdit,
    handleDelete,
  };
}