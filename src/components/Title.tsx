import { Typography } from "@mui/material";

interface TitleProps {
  title: string;
}

const Title = ({ title }: TitleProps) => {
  return (
    <Typography variant="h3" align="center" mt={1} mb={2}>
      {title}
    </Typography>
  );
};

export default Title;
