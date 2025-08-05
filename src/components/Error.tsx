import { Typography } from "@mui/material";

interface ErrorProps {
  error: string;
}

const Error = ({ error }: ErrorProps) => {
  return (
      <Typography color="error" align="center" mt={4}>
        {error}
      </Typography>
    );
};

export default Error;
