import { Typography } from "@mui/material";

interface TitleProps {
  title: string;
}

const Title = ({ title }: TitleProps) => {
  return (
    <Typography variant="h4" align="left" gutterBottom>
      {title}
    </Typography>
  );
};

export default Title;
