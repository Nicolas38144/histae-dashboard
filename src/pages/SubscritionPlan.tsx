import { useState } from 'react';
import { useSubscriptionPlanViewModel } from '../hooks/useSubscriptionPlanViewModel';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import Loader from '../components/Loader';
import Error from '../components/Error';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDateFromDate } from '../utils/general';
import { t } from 'i18next';

const SubscriptionPlan = () => {
  const {
    subscriptionPlans,
    loading,
    error,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useSubscriptionPlanViewModel();

  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState('');
  const [priceCents, setPriceCents] = useState<number>(0);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [features, setFeatures] = useState<string>('');

  const [openConfirm, setOpenConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPriceCents(0);
    setDurationDays(30);
    setFeatures('');
  };

  const handleSubmitAdd = async () => {
    const featuresArray = features
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    await handleAdd(name, priceCents, durationDays, featuresArray);
    setOpenAdd(false);
    resetForm();
  };

  const confirmDelete = (id: string) => {
    setPlanToDelete(id);
    setOpenConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (planToDelete) {
      await handleDelete(planToDelete);
    }
    setOpenConfirm(false);
    setPlanToDelete(null);
  };

  return (
    <Box className="page-subscription" sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}> 
      {loading && <Loader />}
      {error && <Error error={error} />}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
        }}
      >      
        {subscriptionPlans.map((plan) => (
          <Card
            key={plan.id}
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: 3,
              minWidth: 400,
              maxWidth: 400,
              flex: '1 1 400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <CardContent>
              <Typography variant="h5" textAlign={'center'}>
                {plan.name}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                {t("subscriptionPlanPage.price")}: {plan.price_cents / 100} €
              </Typography>
              <Typography variant="body1">
                {t("subscriptionPlanPage.duration")}: {plan.duration_days} {t("subscriptionPlanPage.days")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("subscriptionPlanPage.date")}: {formatDateFromDate(plan.created_at)}
              </Typography>

              <Stack
                direction="row"
                sx={{ mt: 3, flexWrap: 'wrap', justifyContent: 'flex-start', gap: 1 }}
              >
                {plan.features.map((f, i) => (
                  <Chip key={i} label={f} color="default" variant="outlined" />
                ))}
              </Stack>
            </CardContent>

            <CardActions sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => confirmDelete(plan.id)}
              >
                {t("subscriptionPlanPage.delete")}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleEdit(plan)}
              >
                {t("subscriptionPlanPage.modify")}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <Card
          sx={{
            p: 2,
            mt: 3,
            borderRadius: 3,
            boxShadow: 3,
            width: 200,
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.500',
            cursor: 'pointer',
          }}
          onClick={() => setOpenAdd(true)}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Add sx={{ fontSize: 128, color: 'grey.400' }} />
            <Typography variant="body2" color="text.secondary">
              {t("subscriptionPlanPage.addPlan")}
            </Typography>
          </Box>
        </Card>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Prix (€)"
            type="number"
            value={priceCents / 100}
            onChange={(e) => setPriceCents(Number(e.target.value) * 100)}
            required
          />
          <TextField
            label="Durée (jours)"
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            required
          />
          <TextField
            label="Fonctionnalités (séparées par des virgules)"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="Ex: Unlimited messaging, See who liked you"
            multiline
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} color="inherit">
            {t("subscriptionPlanPage.cancel")}
          </Button>
          <Button onClick={handleSubmitAdd} color="primary" variant="contained">
             {t("subscriptionPlanPage.addPlan")}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openConfirm}
        onCancel={() => setOpenConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default SubscriptionPlan;
