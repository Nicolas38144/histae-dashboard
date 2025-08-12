import { Box, Typography } from "@mui/material";

const RenderField = ({ label, value }: { label: string; value: React.ReactNode }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #ddd',
        pb: 0.7,
        pt: 0.7,
      }}
    >
      <Typography variant="subtitle2" color="textSecondary" sx={{ width: 150 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ textAlign: 'left', flexGrow: 1 }}>
        {value}
      </Typography>
    </Box>
  );
};

export default RenderField;