import { Typography } from "@mui/material";

interface TitleProps {
  title: string;
}

export const MainTitle = ({ title }: TitleProps) => {
  return (
    <Typography variant="h3" align="center" mt={1} mb={2}>
      {title}
    </Typography>
  );
};

export const SubTitle = ({ title }: TitleProps) => {
  return (
    <Typography variant="h5" align="center" mb={2}>
      {title}
    </Typography>
  );
};
