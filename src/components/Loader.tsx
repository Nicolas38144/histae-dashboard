import { Box, CircularProgress } from "@mui/material";

const Loader = () => {
  return (
      <Box display="flex" justifyContent="center" mt={4} mb={4}>
        <CircularProgress />
      </Box>
    );
};

export default Loader;
